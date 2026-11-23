import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'
import { validarFormularioObra } from '@/lib/obras/formulario'
import { STATUS_OBRA, type StatusObra } from '@/lib/obras/status'
import { revalidarSitePublico } from '@/lib/cache-site'

// Edita uma obra existente: ficha técnica e status
// (rascunho/publicada/arquivada). Não mexe em imagem — trocar a foto de
// uma obra já publicada é fora do escopo combinado (ver docs/handoff.md,
// "Admin → listagem/edição de obras").
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Os mesmos dois portões de POST /api/obras — comentário completo lá.
  const supabase = await createClient()
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser()

  if (erroAuth || !user) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

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

  const formulario = await request.formData()

  // Mesma validação do cadastro — título e ficha técnica seguem as mesmas
  // regras dos dois lados. `arquivo` não é exigido aqui, e o
  // validador nem olha pra esse campo.
  const dados = validarFormularioObra(formulario)
  if (!dados.ok) {
    return Response.json({ erro: dados.erro }, { status: 400 })
  }

  const statusBruto = formulario.get('status')
  if (typeof statusBruto !== 'string' || !STATUS_OBRA.includes(statusBruto as StatusObra)) {
    return Response.json({ erro: 'Status inválido.' }, { status: 400 })
  }
  const status = statusBruto as StatusObra

  // Um único UPDATE, numa linha só: é atômico por natureza. Se o id não
  // existir, `.single()` devolve erro e a resposta vira 404.
  const { data: obraAtualizada, error: erroObra } = await admin
    .from('obras')
    .update({ ...dados.valor, status })
    .eq('id', id)
    .select()
    .single()

  if (erroObra) {
    // PGRST116 = "nenhuma linha" — o id não bate com obra nenhuma.
    if (erroObra.code === 'PGRST116') {
      return Response.json({ erro: 'Obra não encontrada.' }, { status: 404 })
    }
    return Response.json({ erro: 'Falha ao salvar a obra: ' + erroObra.message }, { status: 500 })
  }

  // Ficha ou status mudou: o site público precisa ser remontado.
  revalidarSitePublico()
  return Response.json({ obra: obraAtualizada })
}

// Exclui uma obra DE VEZ: a linha do banco e os dois arquivos (web e alta).
// Existe pra não lotar o plano grátis do Supabase com foto de teste ou foto
// que a artista desistiu de mostrar. Arquivar (status "Arquivada" ou
// "Rascunho") continua existindo ao lado — é o caminho quando há algo a
// preservar. Ver docs/handoff.md §7, "Excluir foto pelo admin".
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Os mesmos dois portões de POST /api/obras — comentário completo lá.
  const supabase = await createClient()
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser()

  if (erroAuth || !user) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

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
  // 1) LÊ A OBRA — precisamos saber onde estão os arquivos ANTES de apagar
  //    a linha, porque depois não sobra ninguém pra nos dizer.
  // ─────────────────────────────────────────────────────────────
  const { data: obra, error: erroLeitura } = await admin
    .from('obras')
    .select('imagem_web, imagem_alta')
    .eq('id', id)
    .maybeSingle()

  if (erroLeitura) {
    return Response.json({ erro: 'Falha ao ler a obra: ' + erroLeitura.message }, { status: 500 })
  }
  if (!obra) {
    return Response.json({ erro: 'Obra não encontrada.' }, { status: 404 })
  }

  // ─────────────────────────────────────────────────────────────
  // 2) TEM HISTÓRICO DE PEDIDO? ENTÃO NÃO SE EXCLUI.
  //
  // `pedido_itens` (tabela da loja, em standby) guarda o `obra_id` de cada
  // item vendido. O schema dela foi criado pelo painel do Supabase e não
  // está em docs/sql/, então não sabemos se a chave estrangeira foi criada
  // com "on delete cascade" ou não. Se fosse cascade, apagar a obra apagaria
  // junto os itens do pedido — histórico de venda sumindo calado. Por isso a
  // pergunta é feita aqui, às claras, em vez de depender da FK.
  // ─────────────────────────────────────────────────────────────
  const { count: itensDePedido, error: erroPedidos } = await admin
    .from('pedido_itens')
    .select('id', { count: 'exact', head: true })
    .eq('obra_id', id)

  if (erroPedidos) {
    return Response.json({ erro: 'Falha ao conferir pedidos: ' + erroPedidos.message }, { status: 500 })
  }
  if (itensDePedido) {
    return Response.json(
      { erro: 'Esta foto tem histórico de pedido; arquive em vez de excluir.' },
      { status: 409 }
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 3) APAGA OS TAMANHOS DA OBRA
  //
  // Também é tabela da loja. Uma foto excluída de vez não tem mais tamanho
  // nenhum pra vender, então os tamanhos dela vão junto. Apagamos à mão,
  // antes da obra, pelo mesmo motivo do passo 2: não sabemos como a FK de
  // `tamanhos` foi criada, e se ela bloquear, a obra nunca sairia.
  //
  // O limite honesto: se o passo 4 falhar depois deste, a obra continua no
  // site sem os tamanhos. No portfólio isso não aparece em lugar nenhum
  // (nada mostra tamanho hoje), mas fica registrado aqui.
  // ─────────────────────────────────────────────────────────────
  const { error: erroTamanhos } = await admin.from('tamanhos').delete().eq('obra_id', id)

  if (erroTamanhos) {
    return Response.json({ erro: 'Falha ao apagar os tamanhos: ' + erroTamanhos.message }, { status: 500 })
  }

  // ─────────────────────────────────────────────────────────────
  // 4) APAGA A LINHA — o banco vem ANTES dos arquivos, de propósito.
  //
  // Se apagássemos os arquivos primeiro e o banco recusasse, a obra
  // continuaria no site com a imagem quebrada: dado errado na vitrine.
  // Nesta ordem, o pior caso é o contrário: a obra já sumiu do site e sobra
  // um arquivo órfão no bucket — lixo, não dado errado. É o mesmo limite
  // honesto do POST /api/obras.
  // ─────────────────────────────────────────────────────────────
  const { error: erroObra } = await admin.from('obras').delete().eq('id', id)

  if (erroObra) {
    // 23503 = violação de chave estrangeira: alguma outra tabela ainda
    // aponta pra esta obra. Os passos 2 e 3 cobrem as que conhecemos; isto é
    // a rede de proteção pra alguma que não conhecemos.
    if (erroObra.code === '23503') {
      console.error('[DELETE /api/obras] FK impediu a exclusão:', erroObra.message)
      return Response.json(
        { erro: 'Esta foto ainda tem registros ligados a ela no banco; arquive em vez de excluir.' },
        { status: 409 }
      )
    }
    return Response.json({ erro: 'Falha ao excluir a obra: ' + erroObra.message }, { status: 500 })
  }

  // A obra já saiu do banco: o site público não pode mais mostrá-la.
  revalidarSitePublico()

  // ─────────────────────────────────────────────────────────────
  // 5) REMOVE OS ARQUIVOS DOS DOIS BUCKETS
  //
  // A obra já saiu do banco — para a artista, a exclusão deu certo. Se a
  // remoção de um arquivo falhar, registramos no log do servidor e seguimos.
  // ─────────────────────────────────────────────────────────────
  const caminhoWeb = caminhoNoBucketWeb(obra.imagem_web)

  // As duas remoções são independentes, então correm em paralelo.
  const [resultadoWeb, resultadoAlta] = await Promise.all([
    caminhoWeb
      ? admin.storage.from('obras-web').remove([caminhoWeb])
      : Promise.resolve({ error: new Error('caminho não reconhecido em ' + obra.imagem_web) }),
    // Obras antigas (de antes do bucket privado) não têm `imagem_alta`.
    obra.imagem_alta
      ? admin.storage.from('obras-alta').remove([obra.imagem_alta])
      : Promise.resolve({ error: null }),
  ])
  if (resultadoWeb.error) {
    console.error('[DELETE /api/obras] arquivo órfão em obras-web:', resultadoWeb.error.message)
  }
  if (resultadoAlta.error) {
    console.error('[DELETE /api/obras] arquivo órfão em obras-alta:', resultadoAlta.error.message)
  }

  // 204 = deu certo e não há nada a devolver no corpo.
  return new Response(null, { status: 204 })
}

// A obra guarda a URL pública inteira da versão web, mas o Storage quer só o
// caminho dentro do bucket — o que vem depois de "/obras-web/":
//
//   https://xyz.supabase.co/storage/v1/object/public/obras-web/123-foto.webp
//                                                              └─ caminho ─┘
//
// O decode importa: o getPublicUrl passa a URL por encodeURI, então um
// arquivo antigo chamado "WhatsApp Image.jpeg" está gravado como
// "WhatsApp%20Image.jpeg". Mandar isso pro remove() apagaria um arquivo que
// não existe (e o de verdade ficaria lá).
function caminhoNoBucketWeb(urlPublica: string): string | null {
  const marcador = '/obras-web/'
  try {
    // `new URL` separa o caminho de um eventual "?query" no fim.
    const { pathname } = new URL(urlPublica)
    const posicao = pathname.indexOf(marcador)
    if (posicao === -1) return null
    return decodeURIComponent(pathname.slice(posicao + marcador.length))
  } catch {
    return null
  }
}
