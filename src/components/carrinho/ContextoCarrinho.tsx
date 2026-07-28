'use client'

import { useSyncExternalStore } from 'react'

export type ItemCarrinho = {
  tamanhoId: string
  obraId: string
  titulo: string
  rotulo: string
  precoCentavos: number
  imagemUrl: string
  quantidade: number
}

const CHAVE_LOCALSTORAGE = 'bocairu:carrinho'
const QUANTIDADE_MAXIMA_POR_ITEM = 20

// O carrinho é só client-side (localStorage) até o pedido ser confirmado —
// nada é gravado no banco só por adicionar item. O preço guardado aqui é
// cache de exibição; quem decide o total cobrado é sempre a rota
// /api/pedidos, relendo o preço atual de `tamanhos` (ver docs/handoff.md).
//
// Estado vive num módulo só (não em `useState`), sincronizado com
// `localStorage` via `useSyncExternalStore`: é o próprio React que garante
// a hidratação seguir sem mismatch (servidor não tem `localStorage`, então
// `obterSnapshotServidor` sempre devolve vazio; o React troca pro valor
// real só depois de hidratar). Ler/gravar localStorage direto num efeito
// dispararia setState logo na montagem, o que o React considera cascata de
// render evitável — por isso esta abordagem em vez daquela.
let itensAtuais: ItemCarrinho[] = []
let carregadoDoStorage = false
const ouvintes = new Set<() => void>()

function lerDoStorage(): ItemCarrinho[] {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE)
    return bruto ? JSON.parse(bruto) : []
  } catch {
    return []
  }
}

function definirItens(atualizar: (atuais: ItemCarrinho[]) => ItemCarrinho[]) {
  itensAtuais = atualizar(itensAtuais)

  try {
    localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(itensAtuais))
  } catch {
    // localStorage indisponível — carrinho segue funcionando só em memória.
  }

  for (const ouvinte of ouvintes) ouvinte()
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

function obterSnapshot() {
  if (!carregadoDoStorage) {
    itensAtuais = lerDoStorage()
    carregadoDoStorage = true
  }
  return itensAtuais
}

// Referência estável: useSyncExternalStore espera que getServerSnapshot
// devolva sempre o mesmo array entre chamadas — um `[]` novo a cada
// chamada muda de identidade e o React entende isso como "mudou de novo",
// entrando num loop.
const ARRAY_VAZIO: ItemCarrinho[] = []

function obterSnapshotServidor(): ItemCarrinho[] {
  return ARRAY_VAZIO
}

function adicionar(item: Omit<ItemCarrinho, 'quantidade'>, quantidade = 1) {
  definirItens((atuais) => {
    const existente = atuais.find((i) => i.tamanhoId === item.tamanhoId)

    if (existente) {
      return atuais.map((i) =>
        i.tamanhoId === item.tamanhoId
          ? { ...i, quantidade: Math.min(i.quantidade + quantidade, QUANTIDADE_MAXIMA_POR_ITEM) }
          : i
      )
    }

    return [...atuais, { ...item, quantidade: Math.min(quantidade, QUANTIDADE_MAXIMA_POR_ITEM) }]
  })
}

function alterarQuantidade(tamanhoId: string, quantidade: number) {
  if (quantidade < 1) {
    remover(tamanhoId)
    return
  }

  definirItens((atuais) =>
    atuais.map((i) =>
      i.tamanhoId === tamanhoId
        ? { ...i, quantidade: Math.min(quantidade, QUANTIDADE_MAXIMA_POR_ITEM) }
        : i
    )
  )
}

function remover(tamanhoId: string) {
  definirItens((atuais) => atuais.filter((i) => i.tamanhoId !== tamanhoId))
}

function limpar() {
  definirItens(() => [])
}

export function useCarrinho() {
  const itens = useSyncExternalStore(inscrever, obterSnapshot, obterSnapshotServidor)
  const quantidadeTotal = itens.reduce((soma, i) => soma + i.quantidade, 0)

  return { itens, quantidadeTotal, adicionar, alterarQuantidade, remover, limpar }
}
