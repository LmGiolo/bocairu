'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'

import { IconeInstagram, IconeWhatsApp } from '@/components/contato/BotoesContato'
import { INSTAGRAM_URL } from '@/lib/contato'

export type ItemNavegacao = { href: string; rotulo: string }

// O menu do site abaixo de 1024px: um botão "Menu" no cabeçalho que abre
// uma gaveta pela direita com os links e o contato.
//
// Por que existe: com os cinco links e os dois ícones lado a lado, o
// cabeçalho do celular quebrava em três linhas (131px de altura), ficava
// grudado no topo e cobria o conteúdo — e os links ficavam pequenos e
// apertados para o dedo. Agora o cabeçalho tem uma linha só (65px) e os
// links ganham tamanho de toque na gaveta.
//
// A gaveta é um <dialog> nativo aberto com showModal(), como no admin: o
// navegador prende o foco dentro dela, fecha com Esc e deixa a página de
// trás inerte (o §6 do handoff pede isso para menu sobreposto). O deslizar
// é CSS (classe `gaveta` em globals.css).
// `whatsappUrl` vem pronto do Cabecalho (servidor), que lê a mensagem
// editável do banco.
export default function MenuCelular({ itens, whatsappUrl }: { itens: ItemNavegacao[]; whatsappUrl: string }) {
  const gaveta = useRef<HTMLDialogElement>(null)
  const [aberta, setAberta] = useState(false)
  const caminho = usePathname()

  function abrir() {
    gaveta.current?.showModal()
    setAberta(true)
  }

  function fechar() {
    gaveta.current?.close()
  }

  // "Página atual": a Home só quando é exatamente "/" (senão todo caminho
  // começaria com ela); as outras valem também para as subpáginas
  // (/colecoes/retratos ainda é Coleções).
  function ehAtual(href: string) {
    return href === '/' ? caminho === '/' : caminho.startsWith(href)
  }

  return (
    <>
      {/* `botao-menu`: gancho para o CSS pintar o botão de claro quando o
          cabeçalho está transparente por cima da capa da Home. */}
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-expanded={aberta}
        className="botao-menu -mr-2 flex h-10 items-center gap-2.5 px-2 text-xs uppercase tracking-widest text-tinta lg:hidden"
      >
        <svg aria-hidden="true" width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M0 1h20M0 7h20M0 13h20" />
        </svg>
        Menu
      </button>

      <dialog
        ref={gaveta}
        aria-label="Menu"
        // `close` dispara em qualquer jeito de fechar (Esc, ×, link, fundo).
        onClose={() => setAberta(false)}
        // Clique no fundo escurecido: o alvo é o próprio <dialog>.
        onClick={(e) => {
          if (e.target === e.currentTarget) fechar()
        }}
        className="gaveta m-0 ml-auto h-dvh max-h-none w-80 max-w-[85vw] bg-areia p-0 text-tinta open:flex lg:hidden"
      >
        <div className="flex w-full flex-col overflow-y-auto px-7 pb-8 pt-3">
          <div className="flex h-[53px] items-center justify-between">
            <span className="font-serif text-2xl italic tracking-wide">BOCAIRÚ</span>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar menu"
              className="-mr-1 flex h-10 w-10 items-center justify-center rounded-full border border-linho text-lg transition-colors duration-200 hover:border-tinta"
            >
              ×
            </button>
          </div>

          <nav aria-label="Navegação principal" className="mt-8 flex flex-col">
            {itens.map((item) => {
              const atual = ehAtual(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={fechar}
                  aria-current={atual ? 'page' : undefined}
                  className={`flex items-center justify-between border-b border-linho py-4 font-serif text-[28px] leading-tight text-tinta ${
                    atual ? 'italic' : ''
                  }`}
                >
                  {item.rotulo}
                  {atual && (
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ouro" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-10">
            <p className="mb-4 text-sm leading-relaxed text-fumaca">
              Agende uma sessão ou fale sobre uma foto:
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-sm bg-tinta px-5 py-3.5 text-sm tracking-wide text-areia"
              >
                <IconeWhatsApp />
                WhatsApp
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-sm border border-tinta px-5 py-3.5 text-sm tracking-wide text-tinta"
              >
                <IconeInstagram />
                Instagram
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
