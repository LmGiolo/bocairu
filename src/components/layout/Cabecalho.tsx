'use client'

import Link from 'next/link'

import { useCarrinho } from '@/components/carrinho/ContextoCarrinho'

// Navegação do site público. Alguns destinos (Coleções, A Artista, Encomendas)
// ainda não têm página própria — chegam nos próximos passos do caminho de
// construção. O link fica pronto desde já pra não termos que reconstruir o
// Cabeçalho depois.
const NAVEGACAO = [
  { href: '/', rotulo: 'Home' },
  { href: '/galeria', rotulo: 'Galeria' },
  { href: '/colecoes', rotulo: 'Coleções' },
  { href: '/a-artista', rotulo: 'A Artista' },
  { href: '/encomendas', rotulo: 'Encomendas' },
]

export default function Cabecalho() {
  const { quantidadeTotal } = useCarrinho()

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-6 border-b border-linho bg-areia/95 px-6 py-5 backdrop-blur md:px-12 lg:px-24">
      <Link
        href="/"
        className="font-serif text-2xl italic tracking-wide text-tinta"
      >
        BOCAIRÚ
      </Link>

      <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
        <nav
          aria-label="Navegação principal"
          className="flex flex-wrap gap-x-8 gap-y-2 text-xs uppercase tracking-widest"
        >
          {NAVEGACAO.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-tinta/85 transition-opacity duration-200 hover:opacity-100"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <Link
          href="/carrinho"
          aria-label={`Carrinho${quantidadeTotal > 0 ? `, ${quantidadeTotal} item${quantidadeTotal === 1 ? '' : 's'}` : ''}`}
          title="Carrinho"
          className="relative flex items-center text-tinta/85 transition-opacity duration-200 hover:opacity-100"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M5 7h14l-1.4 10.1a2 2 0 0 1-2 1.7H8.4a2 2 0 0 1-2-1.7L5 7Z" />
            <path d="M8.5 7V6a3.5 3.5 0 0 1 7 0v1" />
          </svg>
          {quantidadeTotal > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-vinho px-1 text-[10px] font-semibold text-areia">
              {quantidadeTotal}
            </span>
          )}
        </Link>

        <Link
          href="/entrar"
          aria-label="Minha conta"
          title="Minha conta"
          className="flex items-center text-tinta/85 transition-opacity duration-200 hover:opacity-100"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
          </svg>
        </Link>
      </div>
    </header>
  )
}
