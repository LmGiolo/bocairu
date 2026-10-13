// Cabeçalho padrão de cada aba de Minha Conta: overline dourada + título
// em serifa (mesmo par em todas as telas do protótipo).
export default function Titulo({
  overline,
  children,
  acao,
}: {
  overline: string
  children: React.ReactNode
  /** Botão opcional alinhado à direita (ex.: "+ Novo endereço"). */
  acao?: React.ReactNode
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ouro">
          {overline}
        </div>
        <h1 className="font-serif text-4xl text-tinta">{children}</h1>
      </div>
      {acao}
    </div>
  )
}
