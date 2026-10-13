'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

const ABAS = [
  { href: '/minha-conta', rotulo: 'Painel' },
  { href: '/minha-conta/pedidos', rotulo: 'Meus Pedidos' },
  { href: '/minha-conta/enderecos', rotulo: 'Endereços' },
  { href: '/minha-conta/perfil', rotulo: 'Perfil' },
  { href: '/minha-conta/favoritos', rotulo: 'Favoritos' },
]

// Client component só por causa do `usePathname` (aba ativa) e do "Sair" —
// o layout em volta continua Server Component. O layout não pode descobrir
// a rota atual sozinho: ele não re-renderiza na navegação, então o caminho
// que ele visse ficaria velho.
export default function NavegacaoConta({ ehAdmin }: { ehAdmin: boolean }) {
  const caminho = usePathname()
  const router = useRouter()

  async function sair() {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      aria-label="Navegação da conta"
      // No celular vira uma faixa horizontal com rolagem; a partir de md,
      // a coluna lateral do protótipo.
      className="-mx-6 flex gap-1 overflow-x-auto px-6 text-sm md:mx-0 md:flex-col md:overflow-visible md:px-0"
    >
      {ABAS.map((aba) => {
        // A raiz só fica ativa exatamente nela; as outras abas também
        // contam sub-rotas (ex.: um dia /minha-conta/pedidos/[id]).
        const ativa = aba.href === '/minha-conta' ? caminho === aba.href : caminho.startsWith(aba.href)

        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-sm px-3.5 py-2.5 transition-colors duration-200 ${
              ativa ? 'bg-tinta text-areia' : 'text-tinta hover:bg-creme'
            }`}
          >
            {aba.rotulo}
          </Link>
        )
      })}

      {ehAdmin && (
        <Link
          href="/admin"
          className="shrink-0 whitespace-nowrap rounded-sm px-3.5 py-2.5 text-ouro transition-colors duration-200 hover:bg-creme md:mt-2"
        >
          Painel administrativo
        </Link>
      )}

      <button
        type="button"
        onClick={sair}
        className="shrink-0 whitespace-nowrap rounded-sm px-3.5 py-2.5 text-left text-[13px] text-fumaca transition-colors duration-200 hover:text-tinta md:mt-4 md:border-t md:border-linho md:pt-5"
      >
        Sair da conta
      </button>
    </nav>
  )
}
