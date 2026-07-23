'use client'

import { formatarCentavos } from '@/lib/obras/formulario'
import { useTamanho } from './ContextoTamanho'

export default function SeletorTamanho() {
  const { tamanhos, selecionado, selecionarId } = useTamanho()

  return (
    <div className="mb-8">
      <div className="mb-3.5 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-fumaca">
          Tamanho
        </span>
        <span className="text-sm text-tinta">{selecionado.rotulo}</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {tamanhos.map((tamanho) => {
          const ativo = tamanho.id === selecionado.id

          return (
            <button
              key={tamanho.id}
              type="button"
              onClick={() => selecionarId(tamanho.id)}
              className={`flex min-w-[108px] flex-col items-start gap-0.5 rounded-sm border px-4.5 py-3 text-left text-sm transition-colors duration-200 ${
                ativo
                  ? 'border-tinta bg-tinta text-areia'
                  : 'border-linho bg-white text-tinta hover:border-tinta'
              }`}
            >
              <span className="font-medium">{tamanho.rotulo}</span>
              <span className="text-xs opacity-75">
                {tamanho.disponivel ? formatarCentavos(tamanho.preco_centavos) : 'Indisponível'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
