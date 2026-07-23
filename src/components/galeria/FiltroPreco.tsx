'use client'

import { useEffect, useRef } from 'react'

import { formatarCentavos } from '@/lib/obras/formulario'

type Props = {
  /** Maior preço (em centavos) entre todos os tamanhos do catálogo atual. */
  max: number
  /** Teto selecionado no momento, também em centavos. */
  valor: number
  onChange: (novoValor: number) => void
  aberto: boolean
  onToggle: () => void
  onFechar: () => void
}

export default function FiltroPreco({ max, valor, onChange, aberto, onToggle, onFechar }: Props) {
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    function aoClicarFora(evento: MouseEvent) {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) {
        onFechar()
      }
    }

    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto, onFechar])

  const filtroAtivo = valor < max
  // Passo de R$10 — granularidade razoável sem exigir arrastar até o
  // centavo exato num controle que já é, por natureza, aproximado.
  const passo = 1000

  if (max <= 0) return null

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-full border px-4.5 py-2.5 text-sm transition-colors duration-200 ${
          filtroAtivo ? 'border-tinta bg-tinta text-areia' : 'border-linho bg-transparent text-tinta'
        }`}
      >
        {filtroAtivo ? `Até ${formatarCentavos(valor)}` : 'Faixa de preço ▾'}
      </button>

      {aberto && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[260px] rounded border border-linho bg-white p-4.5 shadow-lg">
          <div className="mb-3 flex justify-between text-sm text-fumaca">
            <span>R$ 0</span>
            <span>{formatarCentavos(max)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={max}
            step={passo}
            value={valor}
            onChange={(evento) => onChange(Number(evento.target.value))}
            className="w-full accent-tinta"
          />
          <div className="mt-2.5 text-xs text-[#9C9280]">
            Mostrando obras até {formatarCentavos(valor)}
          </div>
        </div>
      )}
    </div>
  )
}
