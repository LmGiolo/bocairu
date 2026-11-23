import { ViewTransition } from 'react'

import Cabecalho from '@/components/layout/Cabecalho'
import Rodape from '@/components/layout/Rodape'
import ObservadorAnimacoes from '@/components/animacao/ObservadorAnimacoes'

// CACHE DO SITE PÚBLICO. Cada página daqui de dentro é montada uma vez e
// servida pronta para todos os visitantes, sem consultar o banco a cada
// visita. Duas coisas a renovam:
//
// - o admin: toda gravação que muda o site chama revalidarSitePublico()
//   (src/lib/cache-site.ts), e a próxima visita já vem atualizada;
// - o relógio: no máximo uma hora depois, a página é remontada de qualquer
//   jeito — rede de segurança para mudança feita fora do admin (direto no
//   painel do Supabase, por exemplo).
//
// Só funciona porque as páginas do site usam o client público, sem cookies
// (src/lib/supabase/publico.ts). Se alguma voltar a ler cookies() ou
// headers(), ela sai do cache sem avisar. No `npm run dev` não há cache:
// toda página é montada a cada visita.
export const revalidate = 3600

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
