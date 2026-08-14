// Porte físico do tamanho de impressão (P/M/G) — não é sobre preço, é sobre
// o que custa despachar. Existe pra cruzar com a tabela de frete
// (src/lib/frete), que é regiao × porte, não regiao × obra: um "30x40 cm"
// nesta obra e um "30x40 cm" em outra precisam do mesmo porte pra que a
// tabela de frete seja uma só pro catálogo inteiro, em vez de uma por obra.
export const PORTES = ['P', 'M', 'G'] as const

export type Porte = (typeof PORTES)[number]

export const ROTULOS_PORTE: Record<Porte, string> = {
  P: 'Pequeno (P)',
  M: 'Médio (M)',
  G: 'Grande (G)',
}
