'use client'

import { useEffect, useRef } from 'react'

export type OpcaoFiltro = { valor: string; texto: string }

type Props = {
  rotulo: string
  opcoes: OpcaoFiltro[]
  selecionados: string[]
  onChange: (novos: string[]) => void
  aberto: boolean
  onToggle: () => void
  onFechar: () => void
}

// Dropdown de checkboxes genérico — reaproveitado pra Coleção, Tamanho e
// Orientação em vez de repetir o mesmo bloco três vezes (o protótipo
// repete). Quem controla exclusividade (só um menu aberto por vez) é quem
// usa este componente, via `aberto`/`onToggle`.
export default function FiltroMultiplo({
  rotulo,
  opcoes,
  selecionados,
  onChange,
  aberto,
  onToggle,
  onFechar,
}: Props) {
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

  function alternar(valor: string) {
    onChange(
      selecionados.includes(valor)
        ? selecionados.filter((atual) => atual !== valor)
        : [...selecionados, valor]
    )
  }

  const temSelecao = selecionados.length > 0
  const textoBotao =
    selecionados.length === 0
      ? `${rotulo} ▾`
      : selecionados.length === 1
        ? (opcoes.find((opcao) => opcao.valor === selecionados[0])?.texto ?? rotulo)
        : `${rotulo} · ${selecionados.length}`

  if (opcoes.length === 0) return null

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-full border px-4.5 py-2.5 text-sm transition-colors duration-200 ${
          temSelecao ? 'border-tinta bg-tinta text-areia' : 'border-linho bg-transparent text-tinta'
        }`}
      >
        {textoBotao}
      </button>

      {aberto && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[190px] rounded border border-linho bg-white p-2 shadow-lg">
          {opcoes.map((opcao) => {
            const marcado = selecionados.includes(opcao.valor)

            return (
              <label
                key={opcao.valor}
                className="flex cursor-pointer items-center gap-2.5 rounded px-3.5 py-2.5 text-sm text-tinta hover:bg-areia"
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(opcao.valor)}
                  className="h-4 w-4 accent-tinta"
                />
                {opcao.texto}
              </label>
            )
          })}

          {temSelecao && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full border-t border-linho pt-2.5 text-left text-xs text-fumaca hover:text-tinta"
            >
              Limpar {rotulo.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
