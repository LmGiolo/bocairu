import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import Botao from '@/components/ui/Botao'
import BotaoPagarAgora from '@/components/pedido/BotaoPagarAgora'
import { formatarCentavos } from '@/lib/obras/formulario'
import type { EnderecoEntrega } from '@/lib/pedidos/formulario'
import { ROTULOS_STATUS_PEDIDO, type StatusPedido } from '@/lib/pedidos/status'

// Mensagem principal da tela, conforme o status real do pedido (nunca o
// parâmetro `?pagamento=` sozinho — ele só ajuda a diferenciar "acabou de
// tentar e ainda não confirmou" de "nunca tentou pagar", porque o webhook
// da Stripe (src/app/api/webhooks/stripe/route.ts) pode levar alguns
// segundos a mais que o redirect de volta pra cá, principalmente no Pix).
function mensagemStatus(status: StatusPedido, veioDoPagamento: string | undefined) {
  if (status === 'pago') {
    return {
      titulo: 'Pagamento confirmado.',
      corpo: 'Recebemos o seu pagamento. Assim que a obra entrar em produção, avisamos por e-mail.',
    }
  }
  if (status === 'cancelado') {
    return {
      titulo: 'Pagamento não foi concluído.',
      corpo: 'O pagamento deste pedido não foi confirmado. Você pode tentar de novo abaixo.',
    }
  }
  if (veioDoPagamento === 'sucesso') {
    return {
      titulo: 'Pagamento em processamento.',
      corpo: 'Recebemos o retorno da Stripe e estamos confirmando — a atualização pode levar alguns instantes, principalmente no Pix. Não precisa pagar de novo.',
    }
  }
  return {
    titulo: 'Pedido recebido.',
    corpo: 'Falta concluir o pagamento pra reservarmos a produção da obra.',
  }
}

export default async function DetalhePedido({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pagamento?: string }>
}) {
  const { id } = await params
  const { pagamento } = await searchParams
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
  const status = pedido.status as StatusPedido
  const { titulo, corpo } = mensagemStatus(status, pagamento)

  return (
    <div className="mx-auto max-w-[800px] px-6 py-16 md:px-12 md:py-20 lg:px-24">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
        {ROTULOS_STATUS_PEDIDO[status] ?? pedido.status}
      </div>
      <h1 className="mb-3 font-serif text-4xl text-tinta md:text-5xl">{titulo}</h1>
      <p className="mb-12 max-w-md text-base leading-relaxed text-fumaca">{corpo}</p>

      {/* Só oferece pagar quando faz sentido: pedido nunca pago e o
          cliente não acabou de voltar de um checkout com sucesso (nesse
          caso é só o webhook ainda não ter chegado, não precisa pagar de
          novo). */}
      {status === 'aguardando_pagamento' && pagamento !== 'sucesso' && (
        <div className="-mt-8 mb-12">
          <BotaoPagarAgora pedidoId={pedido.id} />
        </div>
      )}

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

      <div className="mt-6 flex flex-col gap-2 text-sm text-fumaca">
        <div className="flex items-baseline justify-between">
          <span>Obra</span>
          <span>{formatarCentavos(pedido.total_centavos - pedido.frete_centavos)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span>Frete e seguro</span>
          <span>{formatarCentavos(pedido.frete_centavos)}</span>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-linho pt-4">
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
