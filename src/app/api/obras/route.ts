import type { NextRequest } from 'next/server'
import sharp from 'sharp'

import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'
import { validarFormularioObra } from '@/lib/obras/formulario'

// Formatos que aceitamos receber. Não confiamos no que o navegador diz:
// esta lista é conferida depois contra o que o sharp realmente enxergou
// dentro do arquivo.
const FORMATOS_ACEITOS = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'avif']

// Teto de tamanho do original (50 MB). Protege memória do servidor.
const TAMANHO_MAXIMO = 50 * 1024 * 1024

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
  // aos poucos, um preço digitado errado só apareceria depois da imagem
  // já estar no bucket — e aí sobra faxina pra fazer.
  // ─────────────────────────────────────────────────────────────
  const formulario = await request.formData()

  const dados = validarFormularioObra(formulario)
  if (!dados.ok) {
    return Response.json({ erro: dados.erro }, { status: 400 })
  }

  const { tamanhos, ...camposObra } = dados.valor

  const arquivo = formulario.get('arquivo')

  if (!(arquivo instanceof File)) {
    return Response.json({ erro: 'Nenhum arquivo enviado.' }, { status: 400 })
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return Response.json(
      { erro: `Arquivo maior que ${TAMANHO_MAXIMO / 1024 / 1024} MB.` },
      { status: 413 }
    )
  }

  const bytesOriginal = Buffer.from(await arquivo.arrayBuffer())

  // O sharp abre o arquivo e diz o que ele é de verdade. Se não for uma
  // imagem de formato conhecido, ele lança — e um .txt renomeado pra .jpg
  // morre aqui.
  let metadados
  try {
    metadados = await sharp(bytesOriginal).metadata()
  } catch {
    return Response.json({ erro: 'Arquivo não é uma imagem válida.' }, { status: 400 })
  }

  if (!metadados.format || !FORMATOS_ACEITOS.includes(metadados.format)) {
    return Response.json(
      { erro: `Formato não aceito: ${metadados.format ?? 'desconhecido'}.` },
      { status: 415 }
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 2) Gera a versão web: redimensionada e comprimida, sem marca d'água
  // ─────────────────────────────────────────────────────────────
  const bytesWeb = await sharp(bytesOriginal)
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
    .toBuffer()

  // ─────────────────────────────────────────────────────────────
  // 3) A PARTIR DAQUI TUDO TEM VOLTA
  //
  // São quatro gravações em dois sistemas diferentes (Storage e Postgres),
  // e o Supabase não nos dá uma transação que abrace as duas coisas. Então
  // cada passo que dá certo empilha aqui como desfazer ele. Se um passo
  // seguinte falhar, a pilha é executada de trás pra frente e o mundo
  // volta ao que era.
  // ─────────────────────────────────────────────────────────────
  // PromiseLike e não Promise: os builders do Supabase são "thenable" (dá
  // pra dar await), mas não são Promise de verdade e não têm .catch().
  const desfazer: Array<() => PromiseLike<unknown>> = []

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

  // Os dois caminhos compartilham a mesma base, o que deixa óbvio, olhando
  // os buckets, qual alta corresponde a qual web.
  const base = `${Date.now()}-${gerarNomeSeguro(arquivo.name)}`
  const caminhoWeb = `${base}.webp`
  const extensaoOriginal = metadados.format === 'jpeg' ? 'jpg' : metadados.format
  const caminhoAlta = `${base}.${extensaoOriginal}`

  const { error: erroWeb } = await admin.storage
    .from('obras-web')
    .upload(caminhoWeb, bytesWeb, { contentType: 'image/webp' })

  if (erroWeb) {
    return Response.json({ erro: 'Falha ao subir a versão web: ' + erroWeb.message }, { status: 500 })
  }
  desfazer.push(() => admin.storage.from('obras-web').remove([caminhoWeb]))

  const { error: erroAlta } = await admin.storage
    .from('obras-alta')
    .upload(caminhoAlta, bytesOriginal, { contentType: arquivo.type || undefined })

  if (erroAlta) {
    await reverterTudo()
    return Response.json({ erro: 'Falha ao subir o original: ' + erroAlta.message }, { status: 500 })
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
      imagem_web: dadosUrl.publicUrl,
      imagem_alta: caminhoAlta,
    })
    .select()
    .single()

  if (erroObra) {
    await reverterTudo()
    return Response.json({ erro: 'Falha ao criar a obra: ' + erroObra.message }, { status: 500 })
  }
  desfazer.push(() => admin.from('obras').delete().eq('id', obra.id))

  // ─────────────────────────────────────────────────────────────
  // 5) Cria os tamanhos
  // ─────────────────────────────────────────────────────────────
  // Um único insert com a lista inteira, não um insert por tamanho. Isso
  // é um comando SQL só, e comando SQL é atômico no Postgres: ou entram
  // todas as linhas, ou nenhuma. Não existe estado de "metade dos
  // tamanhos salvos" pra limpar depois.
  const { data: tamanhosCriados, error: erroTamanhos } = await admin
    .from('tamanhos')
    .insert(tamanhos.map((tamanho) => ({ ...tamanho, obra_id: obra.id })))
    .select()

  if (erroTamanhos) {
    // Aqui está o caso que você pediu: os tamanhos falharam, então a obra
    // que acabou de nascer é apagada junto com as duas imagens. Não fica
    // obra órfã, nem obra publicada sem preço.
    await reverterTudo()
    return Response.json(
      { erro: 'Falha ao salvar os tamanhos: ' + erroTamanhos.message },
      { status: 500 }
    )
  }

  return Response.json({ obra, tamanhos: tamanhosCriados }, { status: 201 })
}

// Nome de arquivo vindo do usuário não serve como chave de storage: pode ter
// acento, espaço, barra. Reduz pra letras, números, ponto e hífen.
function gerarNomeSeguro(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira os acentos soltos pelo NFD
    .replace(/\.[^.]+$/, '') // tira a extensão (colocamos a nossa depois)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'obra'
}
