import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import Botao from '@/components/ui/Botao'
import { formatarCentavos } from '@/lib/obras/formulario'
import type { EnderecoEntrega } from '@/lib/pedidos/formulario'
import { ROTULOS_STATUS_PEDIDO, type StatusPedido } from '@/lib/pedidos/status'

export default async function DetalhePedido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Sem filtro extra de dono: a policy "cliente vê os seus" já garante que
  // só quem fez o pedido enxerga esta linha (ver docs/handoff.md).
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*, pedido_itens(*)')
    .eq('id', id)
    .single()

  if (!pedido) notFound()

  const endereco = pedido.endereco_entrega as EnderecoEntrega

  return (
    <div className="mx-auto max-w-[800px] px-6 py-16 md:px-12 md:py-20 lg:px-24">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
        {ROTULOS_STATUS_PEDIDO[pedido.status as StatusPedido] ?? pedido.status}
      </div>
      <h1 className="mb-3 font-serif text-4xl text-tinta md:text-5xl">Pedido recebido.</h1>
      <p className="mb-12 max-w-md text-base leading-relaxed text-fumaca">
        Entraremos em contato por e-mail com os próximos passos do pagamento. Nenhum valor foi
        cobrado ainda.
      </p>

      <div className="border-t border-linho">
        {pedido.pedido_itens.map(
          (item: {
            id: string
            obra_titulo: string
            tamanho_rotulo: string
            preco_centavos: number
            quantidade: number
          }) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 border-b border-linho py-5"
            >
              <div>
                <div className="font-serif text-lg italic text-tinta">{item.obra_titulo}</div>
                <div className="mt-1 text-sm text-fumaca">
                  {item.tamanho_rotulo} · {item.quantidade}×
                </div>
              </div>
              <div className="text-sm text-tinta">
                {formatarCentavos(item.preco_centavos * item.quantidade)}
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <span className="text-sm text-fumaca">Total</span>
        <span className="font-serif text-3xl text-tinta">
          {formatarCentavos(pedido.total_centavos)}
        </span>
      </div>

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-ouro">Entrega</div>
          <div className="flex flex-col gap-1 text-sm leading-relaxed text-[#3A342C]">
            <span>
              {endereco.logradouro}, {endereco.numero}
              {endereco.complemento ? ` — ${endereco.complemento}` : ''}
            </span>
            <span>
              {endereco.bairro} · {endereco.cidade}/{endereco.estado}
            </span>
            <span>CEP {endereco.cep}</span>
          </div>
        </div>

        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-ouro">Contato</div>
          <div className="flex flex-col gap-1 text-sm leading-relaxed text-[#3A342C]">
            <span>{pedido.cliente_nome}</span>
            <span>{pedido.cliente_email}</span>
            <span>{pedido.cliente_telefone}</span>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <Botao variante="secundario" href="/galeria">
          Continuar vendo obras
        </Botao>
      </div>
    </div>
  )
}
