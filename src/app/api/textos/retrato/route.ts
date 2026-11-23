import type { NextRequest } from 'next/server'
import sharp from 'sharp'

import type { criarClientAdmin } from '@/lib/supabase/admin'
import { RETRATOS, ehLocalRetrato } from '@/lib/textos'
import { revalidarSitePublico } from '@/lib/cache-site'
import { conferirAdmin } from '@/lib/conferir-admin'
import { apagarEnvio, baixarEnvio, ehCaminhoEnvio } from '@/lib/envios/servidor'

// Os retratos da artista — um por página (Home, A Artista e Contato),
// enviados pela tela /admin/textos. Toda chamada diz de qual página é o
// retrato (`local`: 'home' | 'artista' | 'contato'); trocar o de uma
// página nunca mexe no das outras.
//
// POST   (FormData: envio + local) → gera um webp e troca o retrato
//        daquela página por ele.
// DELETE (?local=...) → tira o retrato daquela página (ela volta a
//        mostrar o "B").
//
// O arquivo vai para o bucket PÚBLICO obras-web, na pasta site/, e a URL
// pública fica na tabela textos_site, na chave da página (RETRATOS em
// src/lib/textos.ts). Não guardamos o original em alta: é foto de
// apresentação, não obra.

// Sem 'heif' (o HEIC do iPhone): o sharp que vem pronto do npm não sabe
// abrir esse formato. Na prática o Safari do iPhone já converte a foto para
// JPEG ao enviar por um <input type="file" accept="image/*">.
const FORMATOS_ACEITOS = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'avif']

// O arquivo não chega nesta rota: o navegador o manda direto para o Storage
// (src/lib/envios/comum.ts) e aqui chega só o caminho, no campo `envio`.
// O teto de tamanho (20 MB — retrato não precisa de arquivo de câmera em
// resolução máxima) é conferido no download, em baixarEnvio().

// Maior lado do webp. A moldura do retrato tem no máximo ~600px de largura
// na tela; 1200px cobre telas retina com folga.
const LADO_MAIOR = 1200

const BUCKET = 'obras-web'

// A URL pública guardada vira o caminho dentro do bucket (o que vem depois
// de "/obras-web/"), que é o que o remove() do Storage quer. Mesmo cuidado
// de caminhoNoBucketWeb em src/app/api/obras/[id]/route.ts.
function caminhoNoBucket(urlPublica: string): string | null {
  const marcador = `/${BUCKET}/`
  try {
    const { pathname } = new URL(urlPublica)
    const posicao = pathname.indexOf(marcador)
    if (posicao === -1) return null
    return decodeURIComponent(pathname.slice(posicao + marcador.length))
  } catch {
    return null
  }
}

type Admin = ReturnType<typeof criarClientAdmin>

async function lerRetratoAtual(admin: Admin, chave: string): Promise<string | null> {
  const { data } = await admin.from('textos_site').select('valor').eq('chave', chave).maybeSingle()
  return data?.valor || null
}

// Apaga o arquivo do retrato antigo. Só depois de o banco já apontar para o
// novo (ou para nada): se falhar, sobra um arquivo órfão no bucket — lixo,
// não um site quebrado. Arquivo fora da pasta site/ não é apagado, por
// garantia (não deveria acontecer, mas assim uma URL estranha no banco
// nunca apaga a foto de uma obra).
async function apagarArquivoAntigo(admin: Admin, urlAntiga: string | null) {
  if (!urlAntiga) return
  const caminho = caminhoNoBucket(urlAntiga)
  if (!caminho || !caminho.startsWith('site/')) return
  const { error } = await admin.storage.from(BUCKET).remove([caminho])
  if (error) console.error('[retrato] arquivo órfão em obras-web:', caminho, error.message)
}

export async function POST(request: NextRequest) {
  const portao = await conferirAdmin()
  if ('erro' in portao) return portao.erro
  const { admin } = portao

  const formulario = await request.formData()
  const envio = formulario.get('envio')
  // Caminho fora do formato que /api/envios gera: recusa sem tocar em nada.
  if (!ehCaminhoEnvio(envio)) {
    return Response.json({ erro: 'Nenhum arquivo enviado.' }, { status: 400 })
  }

  // O arquivo enviado é só matéria-prima: o que fica é o webp. Por isso,
  // dê certo ou errado, ele sai da pasta de passagem no fim (`finally`).
  try {
    return await trocarRetrato(admin, formulario.get('local'), envio)
  } finally {
    await apagarEnvio(admin, envio)
  }
}

async function trocarRetrato(admin: Admin, local: FormDataEntryValue | null, envio: string): Promise<Response> {
  // ── 1) Valida antes de gravar qualquer coisa ──
  if (!ehLocalRetrato(local)) {
    return Response.json({ erro: 'Página do retrato inválida.' }, { status: 400 })
  }
  const { chave } = RETRATOS[local]

  const baixado = await baixarEnvio(admin, envio, 'retrato')
  if (!baixado.ok) {
    return Response.json({ erro: baixado.erro }, { status: baixado.status })
  }
  const bytes = baixado.bytes

  // O sharp diz o que o arquivo é de verdade (não confiamos na extensão).
  let formato: string | undefined
  try {
    formato = (await sharp(bytes).metadata()).format
  } catch {
    return Response.json({ erro: 'Arquivo não é uma imagem válida.' }, { status: 400 })
  }
  if (!formato || !FORMATOS_ACEITOS.includes(formato)) {
    return Response.json({ erro: `Formato não aceito: ${formato ?? 'desconhecido'}.` }, { status: 415 })
  }

  // ── 2) Gera o webp ──
  let webp: Buffer
  try {
    webp = await sharp(bytes)
      .rotate() // honra a rotação do EXIF (foto de celular "deitada")
      .resize({ width: LADO_MAIOR, height: LADO_MAIOR, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    // Cabeçalho de imagem válido, mas conteúdo corrompido/incompleto.
    return Response.json({ erro: 'Não consegui processar esta imagem. Tente outro arquivo.' }, { status: 400 })
  }

  // ── 3) Sobe o arquivo novo ──
  // Nome com data: cada retrato tem um endereço novo, então nenhum
  // navegador ou CDN mostra o antigo guardado em cache.
  const caminho = `site/retrato-${local}-${Date.now()}.webp`
  const { error: erroUpload } = await admin.storage.from(BUCKET).upload(caminho, webp, { contentType: 'image/webp' })
  if (erroUpload) {
    return Response.json({ erro: 'Falha ao subir o retrato: ' + erroUpload.message }, { status: 500 })
  }

  const urlNova = admin.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl
  const urlAntiga = await lerRetratoAtual(admin, chave)

  // ── 4) Aponta o site para o arquivo novo ──
  const { error: erroBanco } = await admin
    .from('textos_site')
    .upsert({ chave, valor: urlNova, atualizado_em: new Date().toISOString() })

  if (erroBanco) {
    // Desfaz o upload: sem a linha no banco, o arquivo novo seria lixo.
    await admin.storage.from(BUCKET).remove([caminho])
    return Response.json({ erro: 'Falha ao salvar o retrato: ' + erroBanco.message }, { status: 500 })
  }

  // O site já aponta para o retrato novo: renova o cache das páginas.
  revalidarSitePublico()

  // ── 5) Só agora apaga o antigo ──
  await apagarArquivoAntigo(admin, urlAntiga)

  return Response.json({ retratoUrl: urlNova }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const portao = await conferirAdmin()
  if ('erro' in portao) return portao.erro
  const { admin } = portao

  const local = request.nextUrl.searchParams.get('local')
  if (!ehLocalRetrato(local)) {
    return Response.json({ erro: 'Página do retrato inválida.' }, { status: 400 })
  }
  const { chave } = RETRATOS[local]

  const urlAntiga = await lerRetratoAtual(admin, chave)
  if (!urlAntiga) return new Response(null, { status: 204 })

  // Primeiro o banco (o site para de mostrar a foto), depois o arquivo.
  const { error } = await admin.from('textos_site').delete().eq('chave', chave)
  if (error) {
    return Response.json({ erro: 'Falha ao remover o retrato: ' + error.message }, { status: 500 })
  }
  revalidarSitePublico()

  await apagarArquivoAntigo(admin, urlAntiga)
  return new Response(null, { status: 204 })
}
