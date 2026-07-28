import Botao from '@/components/ui/Botao'

const PROCESSO = [
  {
    numero: '01',
    titulo: 'Observação',
    texto: 'Tempo de convivência com o lugar ou o tema, sem câmera, antes de qualquer registro.',
  },
  {
    numero: '02',
    titulo: 'Espera',
    texto: 'Voltas sucessivas até a luz, a composição ou o gesto revelarem o que valia a pena guardar.',
  },
  {
    numero: '03',
    titulo: 'Captura',
    texto: 'Poucos cliques, decisão deliberada — nada de still life montado ou ensaio dirigido.',
  },
  {
    numero: '04',
    titulo: 'Seleção',
    texto: 'De uma série longa, só uma fração pequena sobrevive à curadoria final.',
  },
]

export default function AArtista() {
  return (
    <div>
      {/* Abertura — retrato + nome */}
      <section className="mx-auto max-w-[1360px] px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          {/* Mesmo placeholder tipográfico da Home, até existir uma foto real
              da artista (ver docs/handoff.md §8). */}
          <div
            className="flex w-full items-center justify-center border border-linho bg-creme"
            style={{ aspectRatio: '4 / 5' }}
          >
            <span className="font-serif text-8xl italic text-ouro">B</span>
          </div>

          <div>
            <div className="mb-5 text-xs uppercase tracking-widest text-ouro">A artista</div>
            <h1 className="mb-6 font-serif text-4xl text-tinta md:text-5xl">Bocairú.</h1>
            <p className="max-w-md text-lg leading-relaxed text-[#3A342C]">
              Fotógrafa fine art. Trabalha em séries longas, voltando ao mesmo lugar ou ao mesmo
              tema até a imagem parar de mudar.
            </p>
          </div>
        </div>
      </section>

      {/* Biografia */}
      <section className="bg-creme px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 text-xs uppercase tracking-widest text-ouro">Trajetória</div>
          <h2 className="mb-8 font-serif text-3xl text-tinta md:text-4xl">
            Um olhar que espera antes de fotografar.
          </h2>
          <div className="flex flex-col gap-5 text-base leading-relaxed text-[#3A342C]">
            <p>
              Bocairú começou a fotografar tentando guardar um pouco do tempo que passava em
              paisagens que sabia que não veria de novo. Com os anos, essa urgência virou método:
              cada série nasce de uma permanência, não de uma visita.
            </p>
            <p>
              O trabalho se move entre paisagem, retrato e natureza-morta, mas a pergunta é sempre
              a mesma — o que a luz revela quando a gente para de interferir. Não há ensaio nem
              direção, só a espera de um instante que já estava ali.
            </p>
            <p>
              Essa mesma paciência guia a impressão: cada obra é produzida sob encomenda, em
              processo de padrão museológico, pra que o papel carregue a mesma densidade da cena
              original.
            </p>
          </div>
        </div>
      </section>

      {/* Processo criativo */}
      <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="mb-14 max-w-xl">
          <div className="mb-4 text-xs uppercase tracking-widest text-ouro">Processo</div>
          <h2 className="font-serif text-3xl text-tinta md:text-4xl">Como cada série nasce.</h2>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESSO.map((etapa) => (
            <div key={etapa.numero} className="border-t border-linho pt-6">
              <div className="mb-4 font-serif text-2xl italic text-ouro">{etapa.numero}</div>
              <h3 className="mb-2.5 text-base font-medium text-tinta">{etapa.titulo}</h3>
              <p className="text-sm leading-relaxed text-fumaca">{etapa.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-24 text-center md:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-5 font-serif text-3xl text-tinta md:text-4xl">
            Conheça o trabalho completo.
          </h2>
          <p className="mb-9 text-base text-fumaca">
            Cada coleção é um recorte diferente do mesmo olhar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Botao variante="bordo" href="/colecoes">
              Ver coleções
            </Botao>
            <Botao variante="terciario" href="/encomendas">
              Encomendar uma peça →
            </Botao>
          </div>
        </div>
      </section>
    </div>
  )
}
