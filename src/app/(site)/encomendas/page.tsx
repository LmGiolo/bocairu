import FormularioEncomenda from '@/components/encomendas/FormularioEncomenda'

const BULLETS = [
  'Encomenda exclusiva, criada para um espaço específico',
  'Consultoria de curadoria para coleções residenciais',
  'Projetos corporativos e hospitalidade',
]

export default function Encomendas() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 py-20 md:grid-cols-2 md:gap-20 md:px-12 md:py-28 lg:px-24">
        <div>
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
            Encomendas &amp; Consultoria
          </div>
          <h1 className="mb-6 font-serif text-4xl text-tinta md:text-5xl">
            Uma obra sob medida para o seu espaço.
          </h1>
          <p className="mb-8 max-w-md text-base leading-relaxed text-[#3A342C]">
            Para residências e projetos corporativos que buscam uma peça exclusiva, produzida
            especialmente para o ambiente — em diálogo direto com a artista, do conceito à
            instalação.
          </p>
          <div className="flex flex-col gap-3.5">
            {BULLETS.map((bullet) => (
              <div key={bullet} className="flex gap-3.5">
                <span className="shrink-0 text-ouro">—</span>
                <span className="text-sm text-tinta">{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sem foto real ainda — placeholder até a tarefa 7 (Home + A
            Artista + Encomendas) trazer um mecanismo de imagem editável
            pelo admin. Não construir isso só pra esta imagem agora. */}
        <div
          className="flex w-full items-center justify-center border border-linho bg-creme"
          style={{ aspectRatio: '4 / 5' }}
        >
          <span className="font-serif text-8xl italic text-ouro">B</span>
        </div>
      </section>

      {/* Formulário */}
      <section className="bg-creme px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="mx-auto max-w-xl">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
            Consulta inicial
          </div>
          <h2 className="mb-2 font-serif text-3xl text-tinta md:text-4xl">
            Conte sobre o seu projeto.
          </h2>
          <p className="mb-12 text-sm text-fumaca">
            Retornamos em até 2 dias úteis para agendar uma conversa.
          </p>

          <FormularioEncomenda />
        </div>
      </section>

      {/* Contato direto */}
      <section className="mx-auto flex max-w-[1440px] flex-wrap justify-center gap-16 px-6 py-20 text-center md:px-12 lg:px-24">
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-fumaca">E-mail</div>
          <a href="mailto:contato@bocairu.com" className="text-base text-tinta">
            contato@bocairu.com
          </a>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-fumaca">Instagram</div>
          <a href="#" className="text-base text-tinta">
            @bocairu
          </a>
        </div>
      </section>
    </div>
  )
}
