import type { NextRequest } from 'next/server'
import type Stripe from 'stripe'

import { criarClientStripe } from '@/lib/stripe/client'
import { criarClientAdmin } from '@/lib/supabase/admin'

// Endpoint que a própria Stripe chama (servidor-a-servidor) — nunca o
// navegador. Por isso usa o client de service role direto: não existe
// sessão de usuário aqui pra passar pela RLS (mesmo raciocínio de
// POST /api/pedidos, que também usa criarClientAdmin() pra gravar).
//
// Cartão confirma na hora: `checkout.session.completed` já chega com
// `payment_status: 'paid'`. Pix é assíncrono — a mesma sessão completa
// "unpaid" primeiro (cliente ainda olhando o QR code), e só confirma depois
// via `checkout.session.async_payment_succeeded`. Por isso os dois eventos
// são tratados aqui, e `completed` só marca como pago quando o
// payment_status já veio 'paid' de cara (cobre cartão sem esperar um
// segundo evento à toa).
export async function POST(request: NextRequest) {
  const corpo = await request.text()
  const assinatura = request.headers.get('stripe-signature')
  const segredo = process.env.STRIPE_WEBHOOK_SECRET

  if (!assinatura || !segredo) {
    return Response.json({ erro: 'Webhook da Stripe não configurado (STRIPE_WEBHOOK_SECRET ausente).' }, { status: 500 })
  }

  let evento: Stripe.Event
  try {
    evento = criarClientStripe().webhooks.constructEvent(corpo, assinatura, segredo)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'assinatura inválida'
    return Response.json({ erro: `Assinatura do webhook inválida: ${mensagem}` }, { status: 400 })
  }

  const admin = criarClientAdmin()

  // Só atualiza quem ainda está aguardando_pagamento — trava contra evento
  // duplicado ou fora de ordem (a Stripe pode reenviar o mesmo evento, e
  // não existe garantia de ordem de entrega): um pedido que já virou "pago"
  // não pode ser reaberto, nem um já enviado pode "voltar" pra pago.
  //
  // Se a gravação falhar, lança: o catch lá embaixo responde 500, e a Stripe
  // só reenvia o evento quando a resposta não é 2xx. Engolir o erro e
  // responder 200 deixaria o pedido preso em aguardando_pagamento pra
  // sempre, com o dinheiro já cobrado.
  async function marcarComo(pedidoId: string, status: 'pago' | 'cancelado') {
    const { error } = await admin
      .from('pedidos')
      .update({ status, atualizado_em: new Date().toISOString() })
      .eq('id', pedidoId)
      .eq('status', 'aguardando_pagamento')
    if (error) throw error
  }

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const sessao = evento.data.object as Stripe.Checkout.Session
        const pedidoId = sessao.metadata?.pedido_id
        if (pedidoId && sessao.payment_status === 'paid') {
          await marcarComo(pedidoId, 'pago')
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const sessao = evento.data.object as Stripe.Checkout.Session
        const pedidoId = sessao.metadata?.pedido_id
        if (pedidoId) await marcarComo(pedidoId, 'pago')
        break
      }
      case 'checkout.session.async_payment_failed': {
        const sessao = evento.data.object as Stripe.Checkout.Session
        const pedidoId = sessao.metadata?.pedido_id
        if (pedidoId) await marcarComo(pedidoId, 'cancelado')
        break
      }
      default:
        // Qualquer outro evento (a conta recebe todos os tipos que a Stripe
        // manda pro endpoint, não só os que interessam) é ignorado de
        // propósito — sem log de erro, porque não é um erro.
        break
    }
  } catch (erroBanco) {
    console.error(`Falha ao processar o evento ${evento.type} da Stripe:`, erroBanco)
    return Response.json({ erro: 'Falha ao atualizar o pedido.' }, { status: 500 })
  }

  return Response.json({ recebido: true })
}
