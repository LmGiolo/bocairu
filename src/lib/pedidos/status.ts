// Vocabulário do enum `pedidos.status` — único lugar que conhece os 6
// valores e seus rótulos em PT-BR. Usado tanto na confirmação do cliente
// (/pedidos/[id]) quanto na listagem do admin (/admin/pedidos), pra não
// ter duas cópias do mesmo mapa divergindo com o tempo.
export const STATUS_PEDIDO = [
  'aguardando_pagamento',
  'pago',
  'em_producao',
  'enviado',
  'entregue',
  'cancelado',
] as const

export type StatusPedido = (typeof STATUS_PEDIDO)[number]

export const ROTULOS_STATUS_PEDIDO: Record<StatusPedido, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_producao: 'Em produção',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}
