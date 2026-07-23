'use client'

import { useTamanho } from './ContextoTamanho'

type Props = {
  titulo: string
  ano: number | null
}

export default function Certificado({ titulo, ano }: Props) {
  const { selecionado } = useTamanho()

  return (
    <section className="bg-creme px-6 py-24 md:px-12">
      <div className="mx-auto grid max-w-[1360px] items-center gap-16 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
        <div className="relative border border-linho bg-white px-8 py-11">
          <div className="absolute right-5 top-5 flex h-8.5 w-8.5 items-center justify-center rounded-full border border-ouro font-serif text-sm italic text-ouro">
            B
          </div>

          <div className="mb-6 text-[11px] uppercase tracking-widest text-ouro">
            Certificado de Autenticidade
          </div>
          <div className="mb-7 font-serif text-2xl italic text-tinta">{titulo}</div>

          <div className="flex flex-col gap-3.5 border-t border-linho pt-6 text-sm text-tinta">
            <div className="flex justify-between">
              <span className="text-fumaca">Dimensões</span>
              <span>{selecionado.rotulo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fumaca">Edição</span>
              <span>Original única</span>
            </div>
            {ano && (
              <div className="flex justify-between">
                <span className="text-fumaca">Ano</span>
                <span>{ano}</span>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-linho pt-5 font-serif text-xl italic text-tinta">
            Bocairú
          </div>
          <div className="text-[11px] text-fumaca">Assinatura da artista</div>
        </div>

        <div>
          <div className="mb-5 text-xs uppercase tracking-widest text-ouro">
            Garantia de originalidade
          </div>
          <h2 className="mb-6 max-w-md font-serif text-3xl text-tinta">
            Toda obra chega assinada à mão.
          </h2>

          <div className="flex flex-col gap-5">
            <div className="flex gap-4">
              <span className="shrink-0 font-serif text-xl text-ouro">—</span>
              <span className="text-sm leading-relaxed text-[#3A342C]">
                Assinatura original a grafite no verso, com data.
              </span>
            </div>
            <div className="flex gap-4">
              <span className="shrink-0 font-serif text-xl text-ouro">—</span>
              <span className="text-sm leading-relaxed text-[#3A342C]">
                Certificado impresso e assinado, enviado junto à obra, com
                registro no arquivo da artista.
              </span>
            </div>
            <div className="flex gap-4">
              <span className="shrink-0 font-serif text-xl text-ouro">—</span>
              <span className="text-sm leading-relaxed text-[#3A342C]">
                Impressão de padrão museológico, com estabilidade de cor
                superior a 80 anos.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
