import type { Metadata } from 'next'

import Botao from '@/components/ui/Botao'
import Retrato from '@/components/contato/Retrato'
import { paragrafos, type ChaveTexto } from '@/lib/textos'
import { lerConteudoSite } from '@/lib/textos-servidor'

export const metadata: Metadata = {
  title: 'A Artista',
  description: 'Conheça Bocairú, a fotógrafa por trás do portfólio.',
}

// As quatro etapas do processo: o número é fixo (é a ordem), o título e o
// texto de cada uma são editáveis em /admin/textos.
const ETAPAS = [1, 2, 3, 4].map((n) => ({
  numero: `0${n}`,
  chaveTitulo: `artista.processo_${n}_titulo` as ChaveTexto,
  chaveTexto: `artista.processo_${n}_texto` as ChaveTexto,
}))

export default async function AArtista() {
  // Todos os textos desta página vêm de /admin/textos (com o texto padrão
  // de reserva, ver src/lib/textos.ts).
  const { textos, retratos } = await lerConteudoSite()

  return (
    <div>
      {/* Abertura — retrato + nome */}
      <section className="mx-auto max-w-[1360px] px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-20" data-anim="secao">
          {/* Retrato desta página, enviado em /admin/textos — sem ele, o "B". */}
          <Retrato url={retratos.artista} />

          <div>
            <div className="mb-5 text-xs uppercase tracking-widest text-ouro">A artista</div>
            <h1 className="mb-6 font-serif text-4xl text-tinta md:text-5xl">{textos['artista.abertura_titulo']}</h1>
            <div className="flex max-w-md flex-col gap-4 text-lg leading-relaxed text-[#3A342C]">
              {paragrafos(textos['artista.abertura_texto']).map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Biografia */}
      <section className="bg-creme px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="mx-auto max-w-2xl" data-anim="secao">
          <div className="mb-5 text-xs uppercase tracking-widest text-ouro">Trajetória</div>
          <h2 className="mb-8 font-serif text-3xl text-tinta md:text-4xl">{textos['artista.trajetoria_titulo']}</h2>
          <div className="flex flex-col gap-5 text-base leading-relaxed text-[#3A342C]">
            {paragrafos(textos['artista.trajetoria_texto']).map((paragrafo) => (
              <p key={paragrafo}>{paragrafo}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Processo criativo */}
      <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="mb-14 max-w-xl" data-anim="secao">
          <div className="mb-4 text-xs uppercase tracking-widest text-ouro">Processo</div>
          <h2 className="font-serif text-3xl text-tinta md:text-4xl">Como cada série nasce.</h2>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS.map((etapa) => (
            <div key={etapa.numero} className="border-t border-linho pt-6">
              <div className="mb-4 font-serif text-2xl italic text-ouro">{etapa.numero}</div>
              <h3 className="mb-2.5 text-base font-medium text-tinta">{textos[etapa.chaveTitulo]}</h3>
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-fumaca">
                {paragrafos(textos[etapa.chaveTexto]).map((paragrafo) => (
                  <p key={paragrafo}>{paragrafo}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-24 text-center md:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl" data-anim="secao">
          <h2 className="mb-5 font-serif text-3xl text-tinta md:text-4xl">{textos['artista.cta_titulo']}</h2>
          <div className="mb-9 flex flex-col gap-3 text-base text-fumaca">
            {paragrafos(textos['artista.cta_texto']).map((paragrafo) => (
              <p key={paragrafo}>{paragrafo}</p>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Botao variante="bordo" href="/colecoes">
              Ver coleções
            </Botao>
            <Botao variante="terciario" href="/contato">
              Agendar uma sessão →
            </Botao>
          </div>
        </div>
      </section>
    </div>
  )
}
