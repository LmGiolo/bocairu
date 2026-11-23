import { ViewTransition } from 'react'

import Cabecalho from '@/components/layout/Cabecalho'
import Rodape from '@/components/layout/Rodape'
import ObservadorAnimacoes from '@/components/animacao/ObservadorAnimacoes'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Cabecalho />
      {/* O <ViewTransition> em volta do <main> faz a troca de página ser um
          cross-fade (classe "pagina", estilizada em globals.css). O
          cabeçalho fica de fora e parado: é o ponto fixo que mostra que só o
          conteúdo mudou. */}
      <ViewTransition default="pagina">
        <main>{children}</main>
      </ViewTransition>
      <Rodape />
      <ObservadorAnimacoes />
    </>
  )
}
