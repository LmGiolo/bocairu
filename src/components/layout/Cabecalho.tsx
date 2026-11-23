import Link from 'next/link'

import { IconeInstagram, IconeWhatsApp } from '@/components/contato/BotoesContato'
import MenuCelular, { type ItemNavegacao } from '@/components/layout/MenuCelular'
import { INSTAGRAM_URL, whatsAppUrlGeral } from '@/lib/contato'
import { lerConteudoSite } from '@/lib/textos-servidor'

// Navegação do site público. Desde que o site virou portfólio (vendas em
// standby, ver docs/handoff.md), o Cabeçalho não tem mais carrinho nem
// ícone de conta: visitante não faz login. A artista chega no admin pelo
// link discreto do Rodapé.
const NAVEGACAO: ItemNavegacao[] = [
  { href: '/', rotulo: 'Home' },
  { href: '/galeria', rotulo: 'Galeria' },
  { href: '/colecoes', rotulo: 'Coleções' },
  { href: '/a-artista', rotulo: 'A Artista' },
  { href: '/contato', rotulo: 'Contato' },
]

const CLASSE_ICONE = 'flex items-center text-tinta/85 transition-opacity duration-200 hover:opacity-100'

// Duas formas, mesma faixa:
// - a partir de 1024px (`lg`): links e ícones em linha, como no protótipo;
// - abaixo disso: só o logo e o botão "Menu" (MenuCelular), numa linha só
//   de 65px — a altura em que a barra de filtros da Galeria gruda.
export default async function Cabecalho() {
  const { textos } = await lerConteudoSite()
  const whatsappUrl = whatsAppUrlGeral(textos['whatsapp.mensagem_geral'])

  return (
    // `cabecalho`: gancho do "encolher ao rolar" e, na Home, do modo
    // transparente por cima da capa (globals.css).
    // `viewTransitionName`: dá ao cabeçalho uma identidade própria na troca
    // de página, para o CSS mantê-lo parado enquanto o conteúdo faz o
    // cross-fade.
    <header
      className="cabecalho sticky top-0 z-50 flex items-center justify-between gap-6 border-b border-linho bg-areia/95 px-5 py-3 backdrop-blur md:px-12 lg:px-24 lg:py-5"
      style={{ viewTransitionName: 'cabecalho' }}
    >
      <Link
        href="/"
        className="font-serif text-2xl italic tracking-wide text-tinta"
      >
        BOCAIRÚ
      </Link>

      <div className="hidden items-center gap-x-10 lg:flex">
        <nav
          aria-label="Navegação principal"
          className="flex gap-x-8 text-xs uppercase tracking-widest"
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

        <div className="flex items-center gap-5">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" className={CLASSE_ICONE}>
            <IconeInstagram />
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp" className={CLASSE_ICONE}>
            <IconeWhatsApp />
          </a>
        </div>
      </div>

      <MenuCelular itens={NAVEGACAO} whatsappUrl={whatsappUrl} />
    </header>
  )
}
