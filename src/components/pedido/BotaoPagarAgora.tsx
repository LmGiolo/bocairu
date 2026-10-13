'use client'

import { useState } from 'react'

import Botao from '@/components/ui/Botao'

// Usado em /pedidos/[id] quando o pedido ainda está aguardando_pagamento —
// cobre tanto quem cancelou na Stripe (cancel_url volta pra cá) quanto uma
// sessão antiga que expirou sozinha. Reabre uma sessão nova a cada clique
// (POST /api/pedidos/[id]/pagamento) em vez de guardar um link fixo, porque
// a sessão da Stripe expira com o tempo.
export default function BotaoPagarAgora({ pedidoId }: { pedidoId: string }) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function pagar() {
    setErro('')
    setCarregando(true)

    let resposta: Response
    try {
      resposta = await fetch(`/api/pedidos/${pedidoId}/pagamento`, { method: 'POST' })
    } catch {
      setErro('Falha de conexão. Tente de novo.')
      setCarregando(false)
      return
    }

    const corpo: { erro?: string; checkoutUrl?: string } = await resposta.json().catch(() => ({}))

    if (!resposta.ok || !corpo.checkoutUrl) {
      setErro(corpo.erro ?? 'Não foi possível abrir o pagamento.')
      setCarregando(false)
      return
    }

    window.location.href = corpo.checkoutUrl
  }

  return (
    <div>
      <Botao variante="bordo" onClick={pagar} disabled={carregando}>
        {carregando ? 'Abrindo pagamento…' : 'Pagar agora'}
      </Botao>
      {erro && <p className="mt-3 text-sm text-[#B8492E]">{erro}</p>}
    </div>
  )
}
