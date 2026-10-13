import Image from 'next/image'
import Link from 'next/link'

import { exigirUsuario } from '@/lib/conta/sessao'
import { lerPedidosDoCliente } from '@/lib/conta/pedidos'
import { codigoPedido } from '@/lib/pedidos/status'
import { formatarCentavos } from '@/lib/obras/formulario'
import { formatarData } from '@/lib/formatarData'
import Botao from '@/components/ui/Botao'
import Titulo from '@/components/conta/Titulo'
import EtiquetaStatus from '@/components/conta/EtiquetaStatus'
import LinhaDoTempoPedido from '@/components/conta/LinhaDoTempoPedido'

// Histórico de pedidos. Cada linha abre e fecha com <details>/<summary>
// nativos do HTML: dá o "Ver detalhes / Ocultar" do protótipo sem nenhum
// JavaScript (a página continua 100% Server Component) e já vem acessível
// de graça — teclado, leitor de tela e estado aberto/fechado.
export default async function MeusPedidos() {
  const { supabase, user } = await exigirUsuario('/minha-conta/pedidos')
  const pedidos = await lerPedidosDoCliente(supabase, user.id)

  return (
    <>
      <Titulo overline="Histórico">Meus Pedidos</Titulo>

      {pedidos.length === 0 ? (
        <div className="border border-linho bg-white px-6 py-10 text-center">
          <div className="mb-3 font-serif text-2xl italic text-tinta">Nenhum pedido ainda.</div>
          <p className="mb-7 text-sm text-fumaca">Seus pedidos aparecem aqui assim que forem feitos.</p>
          <Botao variante="secundario" href="/galeria">
            Ver a galeria
          </Botao>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pedidos.map((pedido, indice) => {
            const primeiro = pedido.pedido_itens[0]
            const outros = pedido.pedido_itens.length - 1

            return (
              <details
                key={pedido.id}
                // O mais recente já vem aberto, como no protótipo.
                open={indice === 0}
                className="group border border-linho bg-white transition-shadow duration-300 hover:shadow-[0_12px_28px_rgba(27,24,20,0.06)]"
              >
                <summary className="grid cursor-pointer list-none grid-cols-[56px_1fr_auto] items-center gap-4 px-5 py-5 md:grid-cols-[56px_1.6fr_1fr_1fr_1fr_auto] md:px-6 [&::-webkit-details-marker]:hidden">
                  <div className="relative h-14 w-14 overflow-hidden border border-linho bg-creme">
                    {primeiro?.obras?.imagem_web && (
                      <Image
                        src={primeiro.obras.imagem_web}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-tinta">
                      {primeiro?.obra_titulo ?? 'Pedido'}
                      {outros > 0 && ` e mais ${outros}`}
                    </div>
                    <div className="text-xs text-fumaca">{codigoPedido(pedido.id)}</div>
                    {/* No celular, data/status/total cabem embaixo do título. */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fumaca md:hidden">
                      <EtiquetaStatus status={pedido.status} />
                      <span>{formatarCentavos(pedido.total_centavos)}</span>
                    </div>
                  </div>
                  <div className="hidden text-[13px] text-fumaca md:block">
                    {formatarData(pedido.criado_em)}
                  </div>
                  <div className="hidden md:block">
                    <EtiquetaStatus status={pedido.status} />
                  </div>
                  <div className="hidden text-sm text-tinta md:block">
                    {formatarCentavos(pedido.total_centavos)}
                  </div>
                  <span className="rounded-sm border border-tinta px-4 py-2 text-[13px] text-tinta">
                    <span className="group-open:hidden">Ver detalhes</span>
                    <span className="hidden group-open:inline">Ocultar</span>
                  </span>
                </summary>

                <div className="grid gap-10 border-t border-creme px-5 pt-6 pb-7 md:grid-cols-2 md:px-6 md:pl-[104px]">
                  <div>
                    <div className="mb-4 text-xs uppercase tracking-wider text-fumaca">
                      Acompanhamento
                    </div>
                    <LinhaDoTempoPedido status={pedido.status} />
                  </div>

                  <div>
                    <div className="mb-4 text-xs uppercase tracking-wider text-fumaca">
                      Itens · {formatarData(pedido.criado_em)}
                    </div>
                    <ul className="flex flex-col gap-3 text-sm">
                      {pedido.pedido_itens.map((item) => (
                        <li key={item.id} className="flex justify-between gap-4">
                          <span>
                            <span className="text-tinta">{item.obra_titulo}</span>
                            <span className="block text-xs text-fumaca">
                              {item.tamanho_rotulo} · {item.quantidade}×
                            </span>
                          </span>
                          <span className="text-tinta">
                            {formatarCentavos(item.preco_centavos * item.quantidade)}
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-4 text-fumaca">
                        <span>Frete e seguro</span>
                        <span>{formatarCentavos(pedido.frete_centavos)}</span>
                      </li>
                    </ul>

                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      {pedido.status === 'aguardando_pagamento' && (
                        <Botao variante="bordo" href={`/pedidos/${pedido.id}`}>
                          Concluir pagamento
                        </Botao>
                      )}
                      <Link
                        href={`/pedidos/${pedido.id}`}
                        className="text-sm text-tinta underline underline-offset-4 hover:text-vinho-escuro"
                      >
                        Ver pedido completo
                      </Link>
                    </div>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </>
  )
}
