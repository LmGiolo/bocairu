import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import BarraLateral from '@/components/admin/BarraLateral'
import { createClient } from '@/lib/supabase/server'

// "Painel · Bocairú" na aba do navegador. `robots`: o painel não tem nada a
// fazer no Google — mesmo que alguém ache o link, a página só redireciona
// para /entrar, mas assim nem a tentativa entra no índice.
export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Painel · Bocairú' },
  robots: { index: false, follow: false },
}

// Portão de UX pra todo /admin/*, não só a página inicial — a partir de
// agora existe mais de uma rota aqui, e um layout roda pra qualquer rota
// aninhada, então protege as duas sem repetir o código. Isso não vale pra
// rota de API nenhuma: cada uma delas continua tendo que refazer os dois
// portões sozinha (layout não roda pra route handlers).
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  // 1) Quem está logado? (lê a sessão pelos cookies)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar')
  }

  // 2) Essa pessoa é admin? Busca o papel dela na tabela perfis.
  const { data: perfil } = await supabase.from('perfis').select('papel').eq('id', user.id).single()

  if (perfil?.papel !== 'admin') {
    redirect('/entrar')
  }

  // A casca do painel segue docs/prototipo/Admin.dc.html: barra lateral
  // escura de 240px e o conteúdo à direita (padding 44/56px, no máximo
  // 1320px de largura). No celular a barra vira uma faixa no topo — ver
  // BarraLateral.tsx.
  return (
    <div className="min-h-dvh bg-areia text-tinta">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-areia focus:px-4 focus:py-2 focus:text-tinta"
      >
        Pular para o conteúdo
      </a>
      <BarraLateral />
      <main id="conteudo" className="px-5 py-8 md:px-10 lg:ml-60 lg:max-w-[1320px] lg:px-14 lg:py-11">
        {children}
      </main>
    </div>
  )
}
