import type { Metadata } from 'next'

import { BotaoInstagram, BotaoWhatsApp } from '@/components/contato/BotoesContato'
import { INSTAGRAM_EXIBICAO, WHATSAPP_EXIBICAO } from '@/lib/contato'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com Bocairú pelo WhatsApp ou Instagram para agendar uma sessão de fotos.',
}

// Contato do portfólio: dois caminhos diretos, sem formulário. O antigo
// /encomendas gravava um lead no banco (`solicitacoes_encomenda`) — saiu
// junto com as vendas (ver "Vendas em standby" em docs/handoff.md). Agora a
// conversa acontece no WhatsApp/Instagram da artista, onde ela já atende.
export default function Contato() {
  return (
    <section className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 py-20 md:grid-cols-2 md:gap-20 md:px-12 md:py-28 lg:px-24">
      <div data-anim="secao">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">Contato</div>
        <h1 className="mb-6 font-serif text-4xl text-tinta md:text-5xl">Vamos fotografar juntos?</h1>
        <p className="mb-10 max-w-md text-base leading-relaxed text-[#3A342C]">
          Para agendar uma sessão de fotos ou tirar dúvidas, a conversa é direto com a Bocairú,
          pelo WhatsApp. No Instagram você acompanha os trabalhos mais recentes.
        </p>

        <div className="flex flex-wrap gap-4">
          <BotaoWhatsApp />
          <BotaoInstagram />
        </div>

        <dl className="mt-12 grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-xs uppercase tracking-widest text-fumaca">WhatsApp</dt>
          <dd className="text-tinta">{WHATSAPP_EXIBICAO}</dd>
          <dt className="text-xs uppercase tracking-widest text-fumaca">Instagram</dt>
          <dd className="text-tinta">{INSTAGRAM_EXIBICAO}</dd>
        </dl>
      </div>

      {/* Sem retrato real ainda — mesmo placeholder da Home e de A Artista. */}
      <div
        className="flex w-full items-center justify-center border border-linho bg-creme"
        style={{ aspectRatio: '4 / 5' }}
      >
        <span className="font-serif text-8xl italic text-ouro">B</span>
      </div>
    </section>
  )
}
