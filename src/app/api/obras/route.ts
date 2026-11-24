import type { NextRequest } from 'next/server'
// Desde o sharp 0.35 os tipos vêm como exportações nomeadas (não mais
// pendurados em `sharp.Nome`), por isso o OutputInfo é importado à parte.
import sharp, { type OutputInfo } from 'sharp'

import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'
import { validarFormularioObra } from '@/lib/obras/formulario'
import { revalidarSitePublico } from '@/lib/cache-site'
import { BUCKET_ENVIOS } from '@/lib/envios/comum'
import { apagarEnvio, baixarEnvio, ehCaminhoEnvio, nomeBaseDoEnvio } from '@/lib/envios/servidor'

// Formatos que aceitamos receber. Não confiamos no que o navegador diz:
// esta lista é conferida depois contra o que o sharp realmente enxergou
// dentro do arquivo.
const FORMATOS_ACEITOS = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'avif']

// O arquivo NÃO chega nesta rota: o navegador o manda direto para o Storage
// (pasta de passagem envios/, ver src/lib/envios/comum.ts) e aqui chega só
// o caminho, no campo `envio`. Funções serverless recusam requisição acima
// de ~4,5 MB, e foto original de câmera passa disso fácil. O teto de
// tamanho (50 MB) é conferido no download, em baixarEnvio().

// Maior lado da versão web, em pixels. Grande o suficiente pra tela cheia
// em telas retina, pequeno o suficiente pra carregar rápido.
const LADO_MAIOR_WEB = 2000

export async function POST(request: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // PORTÃO 1 — QUEM É VOCÊ?
  //
  // Usa o client normal (chave anon), que lê a sessão dos cookies da
  // requisição. getUser() não confia no cookie: ele manda o token pro
  // servidor de Auth do Supabase, que confere a assinatura. Cookie
  // forjado ou token expirado não passa daqui.
  //
  // (getSession() NÃO serve pra isso — aquele lê o cookie e acredita.)
  // ─────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser()

  if (erroAuth || !user) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  // ─────────────────────────────────────────────────────────────
  // PORTÃO 2 — VOCÊ É ADMIN?
  //
  // O papel é lido com o client de service role, e não com o client da
  // sessão. Parece detalhe, mas é o ponto todo: uma leitura feita com a
  // chave anon passa pelo RLS, então o que a gente vê depende da policy
  // da tabela perfis. Lendo com service role, a resposta vem direto da
  // tabela — nenhuma policy mal escrita consegue mentir sobre o papel.
  //
  // O id da busca vem do user.id devolvido pelo getUser(), ou seja, do
  // token verificado. Ele nunca vem do corpo da requisição, senão
  // qualquer um se passaria por outra pessoa.
  // ─────────────────────────────────────────────────────────────
  const admin = criarClientAdmin()

  const { data: perfil, error: erroPerfil } = await admin
    .from('perfis')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (erroPerfil || perfil?.papel !== 'admin') {
    return Response.json({ erro: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  // Daqui pra baixo: é admin confirmado.

  // ─────────────────────────────────────────────────────────────
  // 1) VALIDA TUDO ANTES DE MEXER EM QUALQUER COISA
  //
  // A ordem aqui é de propósito. Só depois que texto, números e imagem
  // estiverem todos aprovados é que começamos a gravar. Se validássemos
  // aos poucos, um campo digitado errado só apareceria depois da imagem
  // já estar no bucket — e aí sobra faxina pra fazer.
  //
  // Com o envio direto, o original já está na pasta de passagem quando
  // esta rota roda. Por isso toda recusa daqui até o passo 3 apaga esse
  // arquivo antes de responder (senão ele ficaria largado lá). O formulário
  // também valida os campos ANTES de enviar a foto, então na prática isso
  // só acontece com requisição forjada ou imagem inválida.
  // ─────────────────────────────────────────────────────────────
  const formulario = await request.formData()
  const envio = formulario.get('envio')

  // Caminho com formato diferente do que /api/envios gera é recusado sem
  // tocar em arquivo nenhum: pode ser alguém tentando apontar para um
  // original que já pertence a outra obra.
  if (!ehCaminhoEnvio(envio)) {
    return Response.json({ erro: 'Nenhum arquivo enviado.' }, { status: 400 })
  }

  async function recusar(erro: string, status: number) {
    await apagarEnvio(admin, envio as string)
    return Response.json({ erro }, { status })
  }

  const dados = validarFormularioObra(formulario)
  if (!dados.ok) {
    return recusar(dados.erro, 400)
  }

  const camposObra = dados.valor

  const baixado = await baixarEnvio(admin, envio, 'obra')
  if (!baixado.ok) {
    return recusar(baixado.erro, baixado.status)
  }
  const bytesOriginal = baixado.bytes

  // O sharp abre o arquivo e diz o que ele é de verdade. Se não for uma
  // imagem de formato conhecido, ele lança — e um .txt renomeado pra .jpg
  // morre aqui.
  let metadados
  try {
    metadados = await sharp(bytesOriginal).metadata()
  } catch {
    return recusar('Arquivo não é uma imagem válida.', 400)
  }

  if (!metadados.format || !FORMATOS_ACEITOS.includes(metadados.format)) {
    return recusar(`Formato não aceito: ${metadados.format ?? 'desconhecido'}.`, 415)
  }

  // ─────────────────────────────────────────────────────────────
  // 2) Gera a versão web: redimensionada e comprimida, sem marca d'água
  // ─────────────────────────────────────────────────────────────
  let bytesWeb: Buffer
  let infoWeb: OutputInfo
  try {
    const resultado = await sharp(bytesOriginal)
      // Aplica a rotação que estava só anotada no EXIF. Sem isso, foto
      // tirada deitada aparece deitada depois que os metadados somem.
      .rotate()
      .resize({
        width: LADO_MAIOR_WEB,
        height: LADO_MAIOR_WEB,
        fit: 'inside', // cabe dentro da caixa, mantendo a proporção
        withoutEnlargement: true, // imagem menor que isso fica como está
      })
      // Qualidade 82 em webp: praticamente indistinguível do original em
      // tela, com uma fração do peso.
      .webp({ quality: 82 })
      // resolveWithObject também devolve `info`, com a largura/altura finais
      // — depois de rotacionar e redimensionar, ou seja, a proporção que a
      // tela vai mostrar. `metadados.width/height` (acima) é a dimensão
      // bruta do arquivo, de antes da rotação, e vem trocada em fotos
      // verticais com EXIF de 90°/270°.
      .toBuffer({ resolveWithObject: true })
    bytesWeb = resultado.data
    infoWeb = resultado.info
  } catch {
    // Cabeçalho de imagem válido, mas conteúdo corrompido/incompleto.
    return recusar('Não consegui processar esta imagem. Tente outro arquivo.', 400)
  }

  // ─────────────────────────────────────────────────────────────
  // 3) A PARTIR DAQUI TUDO TEM VOLTA
  //
  // São três gravações em dois sistemas diferentes (Storage e Postgres),
  // e o Supabase não nos dá uma transação que abrace as duas coisas. Então
  // cada passo que dá certo empilha aqui como desfazer ele. Se um passo
  // seguinte falhar, a pilha é executada de trás pra frente e o mundo
  // volta ao que era.
  // ─────────────────────────────────────────────────────────────
  // PromiseLike e não Promise: os builders do Supabase são "thenable" (dá
  // pra dar await), mas não são Promise de verdade e não têm .catch().
  //
  // O primeiro item é o original na pasta de passagem: até ser movido para
  // o lugar definitivo, qualquer falha precisa apagá-lo.
  const desfazer: Array<() => PromiseLike<unknown>> = [() => apagarEnvio(admin, envio)]

  async function reverterTudo() {
    // De trás pra frente: desfaz o mais recente primeiro.
    for (const acao of desfazer.reverse()) {
      try {
        await acao()
      } catch {
        // Se a limpeza falhar não há o que fazer além de seguir — entregar
        // o erro pra artista importa mais que a faxina.
      }
    }
  }

  // Os dois caminhos compartilham a mesma base (data + código + nome limpo,
  // herdada do envio), o que deixa óbvio, olhando os buckets, qual alta
  // corresponde a qual web.
  const base = nomeBaseDoEnvio(envio)
  const caminhoWeb = `${base}.webp`
  const extensaoOriginal = metadados.format === 'jpeg' ? 'jpg' : metadados.format
  const caminhoAlta = `${base}.${extensaoOriginal}`

  const { error: erroWeb } = await admin.storage
    .from('obras-web')
    .upload(caminhoWeb, bytesWeb, { contentType: 'image/webp' })

  if (erroWeb) {
    await reverterTudo()
    return Response.json({ erro: 'Falha ao subir a versão web: ' + erroWeb.message }, { status: 500 })
  }
  desfazer.push(() => admin.storage.from('obras-web').remove([caminhoWeb]))

  // O original já está no bucket obras-alta (na pasta de passagem): basta
  // mover para o lugar definitivo, sem subir os bytes de novo. Mover dentro
  // do mesmo bucket é só renomear.
  const { error: erroAlta } = await admin.storage.from(BUCKET_ENVIOS).move(envio, caminhoAlta)

  if (erroAlta) {
    await reverterTudo()
    return Response.json({ erro: 'Falha ao guardar o original: ' + erroAlta.message }, { status: 500 })
  }
  desfazer.push(() => admin.storage.from('obras-alta').remove([caminhoAlta]))

  // ─────────────────────────────────────────────────────────────
  // 4) Cria a obra
  // ─────────────────────────────────────────────────────────────
  // A web é pública, então guardamos a URL pronta — é ela que a /galeria
  // joga no <img>. A de alta fica num bucket PRIVADO: aqui guardamos só o
  // caminho, nunca uma URL. getPublicUrl no bucket obras-alta devolveria
  // um link que não abre; o acesso a ela é por signed URL gerada na hora,
  // ou direto pelo servidor.
  const { data: dadosUrl } = admin.storage.from('obras-web').getPublicUrl(caminhoWeb)

  // Foto nova entra no FIM da ordem do site (maior `ordem` + 1). Assim ela
  // nunca empurra sozinha a capa da Home pra baixo — a artista decide a
  // posição depois, na tela Admin → Ordem.
  const { data: ultima } = await admin
    .from('obras')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()
  const proximaOrdem = (ultima?.ordem ?? 0) + 1

  const { data: obra, error: erroObra } = await admin
    .from('obras')
    .insert({
      // titulo, descricao, ano e a ficha (serie, historia, tecnica...) já
      // vêm validados e com as chaves batendo as colunas.
      ...camposObra,
      // Mantém o comportamento que o UploadTeste já tinha. Se você quiser um
      // fluxo de rascunho → revisão → publicação, este é o lugar de mudar
      // (conferindo antes quais valores a coluna status aceita).
      status: 'publicada',
      ordem: proximaOrdem,
      imagem_web: dadosUrl.publicUrl,
      imagem_alta: caminhoAlta,
      largura_px: infoWeb.width,
      altura_px: infoWeb.height,
    })
    .select()
    .single()

  if (erroObra) {
    await reverterTudo()
    return Response.json({ erro: 'Falha ao criar a obra: ' + erroObra.message }, { status: 500 })
  }
  // A foto nova já aparece no site: joga fora o cache das páginas públicas.
  revalidarSitePublico()
  return Response.json({ obra }, { status: 201 })
}
