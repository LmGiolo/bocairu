import type { Porte } from '@/lib/obras/porte'
import { regiaoDaUf, type Regiao } from './regiao'

export type LinhaFrete = { regiao: Regiao; porte: Porte; valor_centavos: number }
export type ItemParaFrete = { porte: Porte; quantidade: number }

/**
 * Soma o frete do carrinho pra uma UF: cada item paga o valor de
 * regiao×porte vezes a quantidade — cada impressão viaja como peça própria
 * (embalagem/seguro individual), não uma taxa única por pedido.
 *
 * Devolve `null` quando a UF ainda não é válida (formulário sendo
 * digitado) ou quando falta alguma linha region×porte na tabela — nunca 0
 * silencioso: frete grátis por falta de dado seria bug de preço, não
 * promoção. Usado só pra estimativa no checkout; o valor cobrado de
 * verdade é recalculado em POST /api/pedidos, com o mesmo cálculo.
 */
export function calcularFreteCentavos(
  itens: ItemParaFrete[],
  uf: string,
  tabela: LinhaFrete[]
): number | null {
  let regiao: Regiao
  try {
    regiao = regiaoDaUf(uf)
  } catch {
    return null
  }

  let total = 0
  for (const item of itens) {
    const linha = tabela.find((l) => l.regiao === regiao && l.porte === item.porte)
    if (!linha) return null
    total += linha.valor_centavos * item.quantidade
  }

  return total
}
