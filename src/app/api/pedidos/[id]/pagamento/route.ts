import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { criarSessaoCheckout } from '@/lib/stripe/checkoutPedido'

// "Pagar agora" em /pedidos/[id]: reabre uma sessão de pagamento nova pra
// um pedido que ainda está aguardando_pagamento — cobre tanto quem
// cancelou na Stripe (cancel_url volta pra cá) quanto uma sessão antiga
// que expirou sozinha (Checkout Session da Stripe expira depois de um
// tempo parada).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser()

  if (erroAuth || !user) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  // Sem filtro de cliente_id explícito: a policy "cliente vê os seus" já
  // garante isso — se o pedido não for de quem está autenticado, a busca
  // simplesmente não acha nada (mesmo padrão de /pedidos/[id]/page.tsx).
  const { data: pedido, error: erroPedido } = await supabase
    .from('pedidos')
    .select('*, pedido_itens(*)')
    .eq('id', id)
    .single()

  if (erroPedido || !pedido) {
    return Response.json({ erro: 'Pedido não encontrado.' }, { status: 404 })
  }

  if (pedido.status !== 'aguardando_pagamento') {
    return Response.json(
      { erro: 'Este pedido já não está mais aguardando pagamento.' },
      { status: 400 }
    )
  }

  try {
    const sessao = await criarSessaoCheckout({
      pedidoId: pedido.id,
      clienteEmail: pedido.cliente_email,
      itens: pedido.pedido_itens,
      freteCentavos: pedido.frete_centavos,
    })
    return Response.json({ checkoutUrl: sessao.url })
  } catch (erroStripe) {
    console.error('Falha ao reabrir o pagamento na Stripe:', erroStripe)
    return Response.json(
      { erro: 'Não foi possível abrir o pagamento. Tente de novo em instantes.' },
      { status: 500 }
    )
  }
}
