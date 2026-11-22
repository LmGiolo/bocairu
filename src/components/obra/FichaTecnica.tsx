type Props = {
  tecnica: string | null
  material: string | null
}

// Ficha técnica da foto. Desde que o site virou portfólio, saíram as linhas
// de produto à venda (dimensões, edição, assinatura, certificado,
// impressão, papel) — ver "Vendas em standby" em docs/handoff.md. Só
// mostra o que a artista preencheu; sem nenhum campo, a ficha nem aparece.
export default function FichaTecnica({ tecnica, material }: Props) {
  const linhas: Array<[string, string]> = [
    ...(tecnica ? [['Técnica', tecnica] as [string, string]] : []),
    ...(material ? [['Material', material] as [string, string]] : []),
  ]

  if (linhas.length === 0) return null

  return (
    <div className="mb-8 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-linho py-6 text-sm">
      {linhas.map(([rotulo, valor]) => (
        <div key={rotulo} className="contents">
          <div className="text-fumaca">{rotulo}</div>
          <div className="text-tinta">{valor}</div>
        </div>
      ))}
    </div>
  )
}
