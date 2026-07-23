import { createClient } from '@/lib/supabase/server'
import GaleriaInterativa from '@/components/galeria/GaleriaInterativa'

export default async function Galeria({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>
}) {
  const { serie } = await searchParams
  const supabase = await createClient()

  // Busca tudo de uma vez — "catálogo curado, não vasto" (handoff §1), não
  // dá pra justificar paginação de servidor aqui. O RLS garante que só
  // vêm as obras "publicada"; não filtramos status no código.
  const { data: obras, error } = await supabase
    .from('obras')
    .select(
      'id, titulo, ano, tecnica, serie, imagem_web, largura_px, altura_px, tamanhos(rotulo, preco_centavos, disponivel)'
    )
    .order('ordem', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson', padding: 40 }}>Erro: {error.message}</p>
  }

  return (
    <GaleriaInterativa
      obras={obras}
      serieInicial={typeof serie === 'string' ? serie : null}
    />
  )
}
