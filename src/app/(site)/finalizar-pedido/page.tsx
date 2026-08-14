import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import FormularioFinalizarPedido from '@/components/checkout/FormularioFinalizarPedido'

export default async function FinalizarPedido() {
  const supabase = await createClient()

  // Login só é exigido aqui, na confirmação final — montar o carrinho é
  // livre (ver docs/handoff.md). Sem sessão, manda pra /entrar e volta
  // direto pra cá depois.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar?next=/finalizar-pedido')
  }

  // Tabela de frete é dado público de vitrine (mesma policy que deixa
  // qualquer um ler tamanhos.preco_centavos) — dá pra ler com o client de
  // sessão, sem service role. Usada só pra estimativa em tela: o valor
  // cobrado de verdade é recalculado em POST /api/pedidos.
  const { data: fretes } = await supabase.from('fretes').select('regiao, porte, valor_centavos')

  return (
    <FormularioFinalizarPedido
      emailInicial={user.email ?? ''}
      nomeInicial={typeof user.user_metadata?.nome === 'string' ? user.user_metadata.nome : ''}
      tabelaFrete={fretes ?? []}
    />
  )
}
