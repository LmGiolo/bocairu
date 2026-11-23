'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

// Os itens do menu do painel. Do protótipo (docs/prototipo/Admin.dc.html)
// ficaram só os que fazem sentido com as vendas em standby: Dashboard,
// Pedidos, Clientes e Analytics saíram; "Ordem do site" é tela nossa.
// Os símbolos são os mesmos do protótipo — enfeite, por isso `aria-hidden`.
const ITENS = [
  { href: '/admin/obras', rotulo: 'Obras', icone: '▦' },
  { href: '/admin/ordem', rotulo: 'Ordem do site', icone: '◫' },
]

// Barra lateral do painel. Duas formas, a mesma lista de links:
// - a partir de 1024px (`lg`): fixa à esquerda, 240px, sempre aberta;
// - abaixo disso: uma faixa escura no topo com o botão "Menu", que abre a
//   lista numa gaveta por cima da tela.
//
// A gaveta é um <dialog> nativo aberto com showModal(). Ele já dá de graça o
// que o §6 pede para menu sobreposto: o foco fica preso dentro dele, Esc
// fecha, e o resto da página fica inerte (nem o leitor de tela "vaza" pra
// trás).
export default function BarraLateral() {
  const gaveta = useRef<HTMLDialogElement>(null)
  const [gavetaAberta, setGavetaAberta] = useState(false)

  function abrirGaveta() {
    gaveta.current?.showModal()
    setGavetaAberta(true)
  }

  function fecharGaveta() {
    gaveta.current?.close()
  }

  return (
    <>
      {/* ───── Desktop: barra fixa ───── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-10 overflow-y-auto bg-tinta px-5 py-7 text-pedra lg:flex">
        <ConteudoMenu />
      </aside>

      {/* ───── Celular/tablet: faixa no topo + gaveta ───── */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-tinta px-5 py-3.5 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={abrirGaveta}
          aria-haspopup="dialog"
          aria-expanded={gavetaAberta}
          className="rounded-sm border border-areia/25 px-4 py-2 text-[13px] text-areia transition-colors duration-200 hover:border-areia/60"
        >
          Menu
        </button>
      </div>

      <dialog
        ref={gaveta}
        aria-label="Menu do painel"
        // O evento `close` dispara em qualquer forma de fechar (Esc, link,
        // botão ×), então o estado do botão "Menu" se acerta num lugar só.
        onClose={() => setGavetaAberta(false)}
        // Clique no fundo escurecido: o alvo é o próprio <dialog> (o
        // conteúdo ocupa a gaveta inteira, então clique dentro dela tem
        // outro alvo).
        onClick={(e) => {
          if (e.target === e.currentTarget) fecharGaveta()
        }}
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-tinta p-0 text-pedra backdrop:bg-tinta/55 open:flex lg:hidden"
      >
        <div className="flex w-full flex-col gap-10 overflow-y-auto px-5 py-7">
          <button
            type="button"
            onClick={fecharGaveta}
            aria-label="Fechar menu"
            className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-areia/25 text-areia transition-colors duration-200 hover:border-areia/60"
          >
            ×
          </button>
          <ConteudoMenu aoNavegar={fecharGaveta} />
        </div>
      </dialog>
    </>
  )
}

function Logo() {
  return (
    <Link href="/" className="block px-2 font-serif text-[22px] italic text-areia hover:text-areia">
      BOCAIRÚ
      <span className="mt-1 block font-sans text-[11px] not-italic uppercase tracking-[0.08em] text-pedra/80">
        Painel administrativo
      </span>
    </Link>
  )
}

// O miolo do menu (logo, links, conta), igual nas duas formas. `aoNavegar`
// só existe na gaveta: escolher um item fecha ela.
function ConteudoMenu({ aoNavegar }: { aoNavegar?: () => void }) {
  const caminho = usePathname()
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    setSaindo(true)
    await createClient().auth.signOut()
    // `replace`: o botão Voltar não deve levar de novo pra dentro do painel.
    // `refresh`: descarta as páginas do admin que o roteador guardou.
    router.replace('/entrar')
    router.refresh()
  }

  return (
    <>
      <Logo />

      <nav aria-label="Navegação do painel" className="flex flex-col gap-1 text-sm">
        {ITENS.map((item) => {
          const ativo = caminho.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={aoNavegar}
              aria-current={ativo ? 'page' : undefined}
              className={`flex items-center gap-3 rounded px-3 py-[11px] transition-colors duration-200 hover:bg-areia/[0.06] hover:text-areia ${
                ativo ? 'bg-areia/[0.08] text-areia' : 'text-pedra'
              }`}
            >
              <span aria-hidden="true">{item.icone}</span>
              {item.rotulo}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-areia/[0.12] px-3 pt-3">
        <div className="flex items-center gap-2.5 py-1">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ouro text-[13px] font-semibold text-tinta"
          >
            B
          </div>
          <div className="text-[13px] text-areia">
            Bocairú
            <div className="text-[11px] text-pedra/80">Administradora</div>
          </div>
        </div>
        <div className="mt-3 flex gap-5 text-xs">
          <Link href="/" className="text-pedra underline-offset-[3px] hover:text-areia hover:underline">
            Ver o site
          </Link>
          <button
            type="button"
            onClick={sair}
            disabled={saindo}
            className="cursor-pointer text-pedra underline-offset-[3px] hover:text-areia hover:underline disabled:cursor-default"
          >
            {saindo ? 'Saindo…' : 'Sair'}
          </button>
        </div>
      </div>
    </>
  )
}
