'use client'

import type { MouseEvent, Ref } from 'react'

import type { OpcaoFiltro } from './FiltroMultiplo'

type Grupo = {
  rotulo: string
  opcoes: OpcaoFiltro[]
  selecionados: string[]
  onChange: (novos: string[]) => void
}

// Os filtros da Galeria no celular: uma gaveta que sobe da parte de baixo da
// tela (o "bottom sheet" do §5 do handoff). No desktop os mesmos filtros são
// os menus suspensos de FiltroMultiplo, na barra; no celular aqueles menus
// ficavam pequenos para o dedo e a barra, com três linhas, cobria metade da
// tela.
//
// Os filtros valem na hora (a grade atrás já muda); o botão "Ver N obras"
// só fecha a gaveta. É um <dialog> nativo — quem abre é a Galeria, pelo
// `ref`, com showModal(). (No React 19, `ref` chega como uma prop comum —
// não precisa mais de forwardRef.)
export default function FiltrosCelular({
  ref,
  grupos,
  encontradas,
  temFiltroAtivo,
  onLimpar,
}: {
  ref: Ref<HTMLDialogElement>
  grupos: Grupo[]
  encontradas: number
  temFiltroAtivo: boolean
  onLimpar: () => void
}) {
  function fechar(evento: MouseEvent<HTMLElement>) {
    evento.currentTarget.closest('dialog')?.close()
  }

  function alternar(grupo: Grupo, valor: string) {
    grupo.onChange(
      grupo.selecionados.includes(valor)
        ? grupo.selecionados.filter((atual) => atual !== valor)
        : [...grupo.selecionados, valor]
    )
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-filtros"
      onClick={(e) => {
        // Clique no fundo escurecido (o alvo é o próprio <dialog>) fecha.
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
      className="gaveta gaveta-baixo mx-0 mb-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-md bg-areia p-0 text-tinta open:flex md:hidden"
    >
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between border-b border-linho px-6 py-4">
          <h2 id="titulo-filtros" className="font-serif text-2xl">
            Filtros
          </h2>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar filtros"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-linho text-lg"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {grupos
            .filter((grupo) => grupo.opcoes.length > 0)
            .map((grupo) => (
              <fieldset key={grupo.rotulo} className="mb-6 last:mb-0">
                <legend className="mb-2 text-xs uppercase tracking-widest text-fumaca">{grupo.rotulo}</legend>
                {grupo.opcoes.map((opcao) => (
                  // Linha inteira clicável, com 48px de altura: alvo de toque
                  // confortável (o checkbox sozinho tem 20px).
                  <label
                    key={opcao.valor}
                    className="flex min-h-12 cursor-pointer items-center gap-3.5 border-b border-creme text-base last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={grupo.selecionados.includes(opcao.valor)}
                      onChange={() => alternar(grupo, opcao.valor)}
                      className="h-5 w-5 accent-tinta"
                    />
                    {opcao.texto}
                  </label>
                ))}
              </fieldset>
            ))}
        </div>

        <div className="flex items-center gap-4 border-t border-linho px-6 py-4">
          <button
            type="button"
            onClick={onLimpar}
            disabled={!temFiltroAtivo}
            className="text-sm text-tinta underline underline-offset-4 disabled:text-pedra disabled:no-underline"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={fechar}
            className="ml-auto rounded-sm bg-tinta px-6 py-3.5 text-sm tracking-wide text-areia"
          >
            Ver {encontradas} obra{encontradas === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
