'use client'

import { useTamanho } from './ContextoTamanho'

type Props = {
  tecnica: string | null
  material: string | null
  impressao: string | null
  papel: string | null
}

export default function FichaTecnica({ tecnica, material, impressao, papel }: Props) {
  const { selecionado } = useTamanho()

  // Campos que vêm da obra são opcionais — só mostra a linha quando a
  // artista preencheu. Dimensões/Edição/Assinatura/Certificado são fixos.
  const linhas: Array<[string, string]> = [
    ...(tecnica ? [['Técnica', tecnica] as [string, string]] : []),
    ...(material ? [['Material', material] as [string, string]] : []),
    ...(impressao ? [['Impressão', impressao] as [string, string]] : []),
    ...(papel ? [['Papel', papel] as [string, string]] : []),
    ['Dimensões', selecionado.rotulo],
    // Sem tiragem/edição limitada — decisão fechada, ver docs/handoff.md §8.
    ['Edição', 'Original única'],
    ['Assinatura', 'Assinada no verso, a grafite'],
    ['Certificado', 'Autenticidade assinada à mão pela artista'],
  ]

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
