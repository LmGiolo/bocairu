import Cabecalho from '@/components/layout/Cabecalho'
import Rodape from '@/components/layout/Rodape'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Cabecalho />
      <main>{children}</main>
      <Rodape />
    </>
  )
}
