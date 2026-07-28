'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useCarrinho } from '@/components/carrinho/ContextoCarrinho'
import Botao from '@/components/ui/Botao'
import { formatarCentavos } from '@/lib/obras/formulario'

export default function Carrinho() {
  const { itens, alterarQuantidade, remover } = useCarrinho()

  // Subtotal aqui é só exibição, a partir do preço em cache de cada item —
  // o total que de fato conta é recalculado no servidor em /api/pedidos.
  const subtotal = itens.reduce((soma, item) => soma + item.precoCentavos * item.quantidade, 0)

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-24 text-center md:px-12 lg:px-24">
        <div className="mb-4 font-serif text-2xl italic text-tinta">Seu carrinho está vazio.</div>
        <p className="mb-8 text-sm text-fumaca">Encontre uma obra na galeria pra começar.</p>
        <Botao variante="secundario" href="/galeria">
          Ver a galeria
        </Botao>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-16 md:px-12 md:py-20 lg:px-24">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
        {itens.length} obra{itens.length === 1 ? '' : 's'} no carrinho
      </div>
      <h1 className="mb-10 font-serif text-4xl text-tinta md:mb-14 md:text-5xl">Carrinho.</h1>

      <div className="flex flex-col gap-8 border-t border-linho">
        {itens.map((item) => (
          <div key={item.tamanhoId} className="flex gap-5 border-b border-linho pb-8 pt-8">
            <div className="relative h-32 w-28 shrink-0 overflow-hidden border border-linho sm:h-40 sm:w-32">
              <Image
                src={item.imagemUrl}
                alt={item.titulo}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-serif text-lg italic text-tinta">{item.titulo}</div>
                  <div className="mt-1 text-sm text-fumaca">{item.rotulo}</div>
                </div>
                <div className="text-sm text-tinta">{formatarCentavos(item.precoCentavos)}</div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 rounded-full border border-linho px-1 py-1">
                  <button
                    type="button"
                    onClick={() => alterarQuantidade(item.tamanhoId, item.quantidade - 1)}
                    aria-label="Diminuir quantidade"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-tinta transition-colors duration-200 hover:bg-creme"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm text-tinta">{item.quantidade}</span>
                  <button
                    type="button"
                    onClick={() => alterarQuantidade(item.tamanhoId, item.quantidade + 1)}
                    aria-label="Aumentar quantidade"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-tinta transition-colors duration-200 hover:bg-creme"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remover(item.tamanhoId)}
                  className="text-xs text-fumaca underline underline-offset-4 transition-colors duration-200 hover:text-vinho-escuro"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-6 md:mt-14">
        <div>
          <div className="text-xs uppercase tracking-widest text-fumaca">Subtotal</div>
          <div className="mt-1 font-serif text-3xl text-tinta">{formatarCentavos(subtotal)}</div>
        </div>
        <Botao variante="bordo" href="/finalizar-pedido">
          Finalizar pedido
        </Botao>
      </div>

      <div className="mt-6 text-xs text-fumaca">
        <Link href="/galeria" className="text-fumaca underline underline-offset-4">
          ← Continuar vendo obras
        </Link>
      </div>
    </div>
  )
}
