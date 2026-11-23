import { buscarObraPublica } from '@/lib/obras/publicas'
import { imagemOgDaFoto, TAMANHO_OG } from '@/lib/og/imagemOg'

// Pré-visualização da Página de uma foto: a própria foto, recortada em
// 1200×630. É o que aparece quando a artista (ou qualquer pessoa) cola o
// link desta foto no WhatsApp, no direct ou no story do Instagram.
export const alt = 'Fotografia de Bocairú'
export const size = TAMANHO_OG
export const contentType = 'image/jpeg'

// Gerar esta imagem é caro (baixa a foto de 2000px e recorta com o sharp),
// então ela fica em cache como as páginas: gerada na primeira vez que um
// robô de pré-visualização pede, servida pronta depois. Lista vazia =
// nenhuma gerada no build; `revalidate` = refeita no máximo de hora em
// hora (e na hora, quando o admin salva algo — src/lib/cache-site.ts).
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const obra = await buscarObraPublica(id)
  return imagemOgDaFoto(obra?.imagem_web)
}
