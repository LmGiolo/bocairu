import type { ReactNode } from 'react'

// O topo de cada tela do painel, como no protótipo: um sobretítulo pequeno
// em caixa alta, o título em serifa 36px e, à direita, a ação principal
// ("+ Nova obra"). No celular a ação desce para baixo do título.
//
// Sobretítulo em `text-fumaca`, não no ouro do protótipo: ouro em texto
// menor que 18px não passa no contraste AA (§6 do handoff).
export default function CabecalhoPagina({
  sobretitulo,
  titulo,
  descricao,
  acao,
}: {
  sobretitulo: string
  titulo: string
  descricao?: ReactNode
  acao?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
      <div className="min-w-0">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-fumaca">{sobretitulo}</div>
        <h1 className="m-0 font-serif text-4xl font-normal leading-tight">{titulo}</h1>
        {descricao && <div className="mt-3 max-w-2xl text-sm leading-relaxed text-fumaca">{descricao}</div>}
      </div>
      {acao}
    </div>
  )
}
