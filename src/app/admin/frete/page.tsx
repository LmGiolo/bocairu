import { createClient } from '@/lib/supabase/server'
import FormularioFrete from '@/components/admin/FormularioFrete'
import type { LinhaFrete } from '@/lib/frete/calcular'

export default async function AdminFrete() {
  const supabase = await createClient()

  // Dado público de vitrine (mesma policy que deixa qualquer um ler
  // tamanhos.preco_centavos) — não precisa de policy admin-only pra ler.
  const { data: fretes, error } = await supabase.from('fretes').select('regiao, porte, valor_centavos')

  if (error) {
    return <p style={{ color: 'crimson' }}>Erro ao carregar frete: {error.message}</p>
  }

  return (
    <div>
      <h1>Frete por região</h1>
      <FormularioFrete fretes={(fretes ?? []) as LinhaFrete[]} />
    </div>
  )
}
