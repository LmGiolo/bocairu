import { createClient } from '@/lib/supabase/server'
import { imagemOgDaFoto, TAMANHO_OG } from '@/lib/og/imagemOg'

// Pré-visualização da Página de uma foto: a própria foto, recortada em
// 1200×630. É o que aparece quando a artista (ou qualquer pessoa) cola o
// link desta foto no WhatsApp, no direct ou no story do Instagram.
export const alt = 'Fotografia de Bocairú'
export const size = TAMANHO_OG
export const contentType = 'image/jpeg'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: obra } = await supabase.from('obras').select('imagem_web').eq('id', id).maybeSingle()

  return imagemOgDaFoto(obra?.imagem_web)
}
