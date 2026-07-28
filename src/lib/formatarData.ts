// Formata um timestamp ISO (de `criado_em`/`atualizado_em`) como DD/MM/AAAA.
// Usado nas listagens do admin (Encomendas, Pedidos) — mesmo formato nos dois.
export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
