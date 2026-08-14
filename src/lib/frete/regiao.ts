// As 5 macro-regiões do Brasil, usadas como chave da tabela de frete
// (regiao × porte → valor). `regiao` é texto livre no banco, não enum —
// de propósito: escalar pra frete por estado no futuro é só inserir linhas
// novas em `fretes` (uma por UF), sem migração de schema. Este arquivo é o
// único lugar que converte UF em região; se um dia a tabela virar por UF,
// é aqui que `regiaoDaUf` deixa de ser chamada (o valor já vem pronto).
export const REGIOES = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'] as const

export type Regiao = (typeof REGIOES)[number]

export const ROTULOS_REGIAO: Record<Regiao, string> = {
  norte: 'Norte',
  nordeste: 'Nordeste',
  'centro-oeste': 'Centro-Oeste',
  sudeste: 'Sudeste',
  sul: 'Sul',
}

const UF_PARA_REGIAO: Record<string, Regiao> = {
  AC: 'norte', AP: 'norte', AM: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste',
  PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centro-oeste', GO: 'centro-oeste', MT: 'centro-oeste', MS: 'centro-oeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
}

/** `uf` já validada (ver validarEndereco em lib/pedidos/formulario.ts) — só as 27 UFs de verdade chegam aqui. */
export function regiaoDaUf(uf: string): Regiao {
  const regiao = UF_PARA_REGIAO[uf.toUpperCase()]

  if (!regiao) {
    throw new Error(`UF desconhecida: "${uf}".`)
  }

  return regiao
}
