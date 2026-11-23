import Link from 'next/link'

import { INSTAGRAM_EXIBICAO, INSTAGRAM_URL, WHATSAPP_EXIBICAO, WHATSAPP_URL_GERAL } from '@/lib/contato'

export default function Rodape() {
  return (
    <footer className="mt-16 bg-tinta px-6 py-16 text-pedra md:px-12 lg:px-24">
      <div className="mx-auto grid max-w-[1440px] gap-12 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-3 font-serif text-2xl italic text-areia">
            BOCAIRÚ
          </div>
          <p className="max-w-xs text-sm">
            Fotografia autoral. Sessões de foto sob agendamento.
          </p>
        </div>

        <div>
          <div className="mb-4 text-xs uppercase tracking-widest text-fumaca">
            Navegação
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/" className="text-pedra">Home</Link>
            <Link href="/colecoes" className="text-pedra">Coleções</Link>
            <Link href="/galeria" className="text-pedra">Galeria</Link>
            <Link href="/a-artista" className="text-pedra">A Artista</Link>
          </div>
        </div>

        <div>
          <div className="mb-4 text-xs uppercase tracking-widest text-fumaca">
            Contato
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <a href={WHATSAPP_URL_GERAL} target="_blank" rel="noopener noreferrer" className="text-pedra">
              WhatsApp {WHATSAPP_EXIBICAO}
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-pedra">
              Instagram {INSTAGRAM_EXIBICAO}
            </a>
            <Link href="/contato" className="text-pedra">
              Contato
            </Link>
            {/* Único caminho clicável até o admin — sem ele, só digitando
                a URL na mão. Visível pra qualquer visitante (como no
                protótipo): quem não é admin só esbarra no redirect de
                admin/layout.tsx, sem risco nenhum. */}
            <Link href="/admin" className="mt-1.5 text-xs text-fumaca hover:text-pedra">
              Painel administrativo
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] border-t border-white/10 pt-6 text-xs text-fumaca">
        © {new Date().getFullYear()} Bocairú. Todos os direitos reservados.
      </div>
    </footer>
  )
}
