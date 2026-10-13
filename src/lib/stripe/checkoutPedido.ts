import 'server-only'
import type Stripe from 'stripe'

import { criarClientStripe } from './client'

type ItemParaCheckout = {
  obra_titulo: string
  tamanho_rotulo: string
  preco_centavos: number
  quantidade: number
}

// Monta a Checkout Session da Stripe a partir de um pedido já gravado no
// banco — usada tanto logo depois de criar o pedido (POST /api/pedidos)
// quanto pra reabrir o pagamento se o cliente cancelar ou a sessão
// expirar sozinha (POST /api/pedidos/[id]/pagamento, botão "Pagar agora"
// em /pedidos/[id]).
//
// Nunca recalcula preço aqui: o pedido já gravado é a fonte da verdade
// nesse ponto — o preço foi conferido contra `tamanhos` uma única vez, em
// POST /api/pedidos, antes do INSERT (mesmo princípio de
// "preço nunca vem do navegador" documentado em docs/handoff.md, só que
// aplicado à Stripe em vez de ao carrinho).
export async function criarSessaoCheckout({
  pedidoId,
  clienteEmail,
  itens,
  freteCentavos,
}: {
  pedidoId: string
  clienteEmail: string
  itens: ItemParaCheckout[]
  freteCentavos: number
}): Promise<Stripe.Checkout.Session> {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) {
    throw new Error('SITE_URL não configurada — necessária pra montar as URLs de retorno da Stripe.')
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = itens.map((item) => ({
    quantity: item.quantidade,
    price_data: {
      currency: 'brl',
      unit_amount: item.preco_centavos,
      product_data: {
        name: `${item.obra_titulo} — ${item.tamanho_rotulo}`,
      },
    },
  }))

  // Frete só vira linha própria quando existe — pedido que não tem frete
  // calculado (não deveria acontecer, POST /api/pedidos recusa isso) não
  // gera uma linha de R$ 0 sem sentido.
  if (freteCentavos > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'brl',
        unit_amount: freteCentavos,
        product_data: { name: 'Frete e seguro' },
      },
    })
  }

  const stripe = criarClientStripe()

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'pix'],
    line_items: lineItems,
    customer_email: clienteEmail,
    client_reference_id: pedidoId,
    // O webhook (src/app/api/webhooks/stripe/route.ts) lê isto pra saber
    // qual linha de `pedidos` atualizar — é o único elo entre a sessão da
    // Stripe e o nosso banco.
    metadata: { pedido_id: pedidoId },
    success_url: `${siteUrl}/pedidos/${pedidoId}?pagamento=sucesso`,
    cancel_url: `${siteUrl}/pedidos/${pedidoId}?pagamento=cancelado`,
  })
}
