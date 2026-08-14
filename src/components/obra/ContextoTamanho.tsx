'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import type { Porte } from '@/lib/obras/porte'

export type Tamanho = {
  id: string
  rotulo: string
  preco_centavos: number
  disponivel: boolean
  prazo_dias: string | null
  porte: Porte
}

type ContextoTamanhoValor = {
  tamanhos: Tamanho[]
  selecionado: Tamanho
  selecionarId: (id: string) => void
}

const ContextoTamanho = createContext<ContextoTamanhoValor | null>(null)

// O tamanho escolhido afeta ficha técnica, preço/CTA e o certificado —
// três blocos que não são vizinhos no layout da página. Em vez de passar o
// estado por props por três níveis, quem precisa dele lê daqui.
export function ProvedorTamanho({
  tamanhos,
  children,
}: {
  tamanhos: Tamanho[]
  children: ReactNode
}) {
  const [selecionadoId, setSelecionadoId] = useState(tamanhos[0]?.id)

  const selecionado = useMemo(
    () => tamanhos.find((tamanho) => tamanho.id === selecionadoId) ?? tamanhos[0],
    [tamanhos, selecionadoId]
  )

  return (
    <ContextoTamanho.Provider value={{ tamanhos, selecionado, selecionarId: setSelecionadoId }}>
      {children}
    </ContextoTamanho.Provider>
  )
}

export function useTamanho() {
  const contexto = useContext(ContextoTamanho)

  if (!contexto) {
    throw new Error('useTamanho precisa ser usado dentro de <ProvedorTamanho>.')
  }

  return contexto
}
