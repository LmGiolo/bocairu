// Vocabulário do enum `obra_status` (Postgres) — mesmo espírito de
// src/lib/pedidos/status.ts: um lugar só que conhece os valores e os
// rótulos em PT-BR, usado tanto na listagem quanto na edição no admin.
//
// RLS: a policy pública ("obras: público vê publicadas") só deixa
// 'publicada' passar pra quem não é admin — 'rascunho' e 'arquivada' saem
// da vitrine automaticamente, sem precisar de filtro extra no código.
export const STATUS_OBRA = ['rascunho', 'publicada', 'arquivada'] as const

export type StatusObra = (typeof STATUS_OBRA)[number]

export const ROTULOS_STATUS_OBRA: Record<StatusObra, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  arquivada: 'Arquivada',
}
