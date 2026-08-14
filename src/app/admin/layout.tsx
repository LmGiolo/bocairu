import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

const NAVEGACAO = [
  { href: '/admin', rotulo: 'Cadastrar obra' },
  { href: '/admin/obras', rotulo: 'Obras' },
  { href: '/admin/pedidos', rotulo: 'Pedidos' },
  { href: '/admin/encomendas', rotulo: 'Encomendas' },
  { href: '/admin/frete', rotulo: 'Frete' },
]

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

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', gap: 16, padding: '16px 40px', borderBottom: '1px solid #ccc' }}>
        {NAVEGACAO.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.rotulo}
          </Link>
        ))}
      </nav>
      <main style={{ padding: 40 }}>{children}</main>
    </div>
  )
}
