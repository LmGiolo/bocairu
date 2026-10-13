import { ROTULOS_STATUS_PEDIDO, type StatusPedido } from '@/lib/pedidos/status'

// Cor de fundo/texto por status. A cor é só reforço — o rótulo por escrito
// está sempre lá (WCAG: estado nunca comunicado só por cor, ver
// docs/handoff.md §6).
const CORES: Record<StatusPedido, string> = {
  aguardando_pagamento: 'bg-[#F3E6E4] text-vinho',
  pago: 'bg-[#F5EDE2] text-ouro',
  em_producao: 'bg-[#F5EDE2] text-ouro',
  enviado: 'bg-[#F5EDE2] text-ouro',
  entregue: 'bg-[#F0EEE9] text-fumaca',
  cancelado: 'bg-[#F6E7E2] text-[#B8492E]',
}

export default function EtiquetaStatus({ status }: { status: StatusPedido }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] ${CORES[status]}`}>
      {ROTULOS_STATUS_PEDIDO[status] ?? status}
    </span>
  )
}
