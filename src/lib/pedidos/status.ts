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

// Linha do tempo que o cliente vê em Minha Conta: os status "felizes" na
// ordem em que acontecem (cancelado fica de fora — não é uma etapa, é um
// desvio). O rótulo aqui descreve o que JÁ aconteceu, por isso difere do
// ROTULOS_STATUS_PEDIDO (o primeiro passo é "Pedido recebido", não
// "Aguardando pagamento").
export const ETAPAS_PEDIDO: ReadonlyArray<{ status: StatusPedido; rotulo: string }> = [
  { status: 'aguardando_pagamento', rotulo: 'Pedido recebido' },
  { status: 'pago', rotulo: 'Pagamento aprovado' },
  { status: 'em_producao', rotulo: 'Em produção — impressão e certificado de autenticidade' },
  { status: 'enviado', rotulo: 'Enviado' },
  { status: 'entregue', rotulo: 'Entregue' },
]

// Pedido pago e ainda não entregue — o que o Painel chama de "em andamento".
export const STATUS_EM_ANDAMENTO: ReadonlyArray<StatusPedido> = ['pago', 'em_producao', 'enviado']

// Pedido cuja obra já é do cliente (pago em diante, sem cancelamento).
export const STATUS_ADQUIRIDO: ReadonlyArray<StatusPedido> = [...STATUS_EM_ANDAMENTO, 'entregue']

// Código curto pra mostrar ao cliente ("#3F9A1C2B") — o id real é um uuid
// de 36 caracteres, ilegível numa conversa por e-mail. Os 8 primeiros
// caracteres bastam pra artista achar o pedido em /admin/pedidos.
export function codigoPedido(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`
}
