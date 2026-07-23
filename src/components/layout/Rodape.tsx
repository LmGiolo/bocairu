import Link from 'next/link'

export default function Rodape() {
  return (
    <footer className="mt-16 bg-tinta px-6 py-16 text-pedra md:px-12 lg:px-24">
      <div className="mx-auto grid max-w-[1440px] gap-12 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-3 font-serif text-2xl italic text-areia">
            BOCAIRÚ
          </div>
          <p className="max-w-xs text-sm">
            Fotografia fine art e obras exclusivas, produzidas em processos
            de padrão museológico.
          </p>
        </div>

        <div>
          <div className="mb-4 text-xs uppercase tracking-widest text-fumaca">
            Navegação
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/" className="text-pedra">Home</Link>
            <Link href="/colecoes" className="text-pedra">Coleções</Link>
            <Link href="/a-artista" className="text-pedra">A Artista</Link>
          </div>
        </div>

        <div>
          <div className="mb-4 text-xs uppercase tracking-widest text-fumaca">
            Contato
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <a href="#" className="text-pedra">contato@bocairu.com</a>
            <a href="#" className="text-pedra">@bocairu</a>
            <Link href="/encomendas" className="text-pedra">
              Encomendas &amp; Consultoria
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
