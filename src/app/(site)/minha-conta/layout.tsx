import { lerUsuario } from '@/lib/conta/sessao'
import NavegacaoConta from '@/components/conta/NavegacaoConta'

// Moldura de todas as abas de Minha Conta: barra lateral (avatar + nome +
// navegação) e a coluna de conteúdo. Fica dentro de (site), então ganha
// Cabeçalho/Rodapé do site público.
//
// Este layout NÃO redireciona quem não está logado — cada página faz isso
// sozinha com `exigirUsuario` (ver src/lib/conta/sessao.ts). Aqui, sem
// usuário, ele só não desenha a barra lateral; a página logo em seguida
// manda pra /entrar.
export default async function LayoutMinhaConta({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { supabase, user } = await lerUsuario()

  if (!user) return <>{children}</>

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, papel')
    .eq('id', user.id)
    .single()

  const nome = perfil?.nome?.trim() || user.email || 'Minha conta'

  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-6 pt-10 pb-24 md:grid-cols-[220px_1fr] md:gap-14 md:px-12 md:pt-14">
      <aside className="md:sticky md:top-24 md:self-start">
        <div className="mb-6 flex items-center gap-3 border-b border-linho pb-6 md:mb-8">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ouro text-base font-semibold text-tinta"
          >
            {nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-tinta">{nome}</div>
            <div className="truncate text-xs text-fumaca">{user.email}</div>
          </div>
        </div>

        <NavegacaoConta ehAdmin={perfil?.papel === 'admin'} />
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  )
}
