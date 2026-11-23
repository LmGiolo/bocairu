import { INSTAGRAM_URL, WHATSAPP_URL_GERAL } from '@/lib/contato'

// Ícones em SVG inline (traço fino, mesmo estilo dos ícones do Cabeçalho)
// — sem biblioteca de ícones só pra dois desenhos.
export function IconeWhatsApp() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8L4 20Z" strokeLinejoin="round" />
      <path d="M9.2 8.6c.2-.5.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.2.5-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.7-.6.9-.6.3-1.6.4-3.2-.4a8.4 8.4 0 0 1-3.6-3.6c-.8-1.6-.7-2.6-.5-3.3Z" />
    </svg>
  )
}

export function IconeInstagram() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

const CLASSE_BASE =
  'inline-flex items-center justify-center gap-2.5 rounded-sm px-8 py-4 text-sm tracking-wide transition-colors duration-200'

// Botão do WhatsApp. `href` opcional: sem ele, abre com a mensagem geral;
// a Página da Obra passa um link com a mensagem que cita a foto.
//
// Links externos usam <a> comum (não o <Link> do Next, que é pra navegar
// dentro do site) com target="_blank" — abre o app/aba do WhatsApp sem
// tirar a pessoa do portfólio. `rel="noopener noreferrer"` impede a aba
// nova de controlar esta aqui (proteção padrão pra qualquer _blank).
export function BotaoWhatsApp({ href = WHATSAPP_URL_GERAL, rotulo = 'Conversar no WhatsApp' }: { href?: string; rotulo?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`botao-bordo ${CLASSE_BASE} bg-vinho text-areia hover:bg-vinho-escuro`}>
      <IconeWhatsApp />
      {rotulo}
    </a>
  )
}

export function BotaoInstagram() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`botao-secundario ${CLASSE_BASE} border border-tinta text-tinta hover:bg-tinta hover:text-areia`}
    >
      <IconeInstagram />
      Ver no Instagram
    </a>
  )
}
