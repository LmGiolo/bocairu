import { criarClientPublico } from '@/lib/supabase/publico'
import { imagemOgDaFoto, TAMANHO_OG } from '@/lib/og/imagemOg'

// Pré-visualização padrão do site inteiro (Home, Galeria, Contato...): a
// foto que está na capa da Home — a posição 1 da tela Admin → Ordem do site.
// Trocou a capa, a pré-visualização acompanha. A Página de cada foto tem a
// própria (src/app/(site)/obras/[id]/opengraph-image.tsx), que vence esta.
export const alt = 'Fotografia de Bocairú'
export const size = TAMANHO_OG
export const contentType = 'image/jpeg'

// Gerada uma vez e servida pronta (o recorte com sharp é caro); refeita no
// máximo de hora em hora, ou na hora em que o admin salva algo
// (src/lib/cache-site.ts) — trocar a capa, por exemplo.
export const revalidate = 3600

export default async function Image() {
  const supabase = criarClientPublico()

  // Mesma ordem da Home. O RLS só devolve obra publicada pra quem não está
  // logado — e quem busca esta imagem é o robô do WhatsApp/Instagram.
  const { data: capa } = await supabase
    .from('obras')
    .select('imagem_web')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true })
    .limit(1)
    .maybeSingle()

  return imagemOgDaFoto(capa?.imagem_web)
}
