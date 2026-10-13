import Link from 'next/link'

import { exigirUsuario } from '@/lib/conta/sessao'
import { lerPedidosDoCliente } from '@/lib/conta/pedidos'
import { codigoPedido, STATUS_ADQUIRIDO, STATUS_EM_ANDAMENTO } from '@/lib/pedidos/status'
import Botao from '@/components/ui/Botao'
import Titulo from '@/components/conta/Titulo'
import LinhaDoTempoPedido from '@/components/conta/LinhaDoTempoPedido'

// Painel: três números (obras adquiridas, pedidos em andamento, favoritos)
// e o acompanhamento do pedido mais recente.
export default async function PainelConta() {
  const { supabase, user } = await exigirUsuario('/minha-conta')

  const [pedidos, { data: perfil }, { count: totalFavoritos }] = await Promise.all([
    lerPedidosDoCliente(supabase, user.id),
    supabase.from('perfis').select('nome').eq('id', user.id).single(),
    // `head: true` = só a contagem, sem trazer as linhas.
    supabase
      .from('favoritos')
      .select('obra_id', { count: 'exact', head: true })
      .eq('cliente_id', user.id),
  ])

  // "Obras adquiridas" conta peças (quantidade), não pedidos: um pedido com
  // duas impressões são duas obras na parede.
  const obrasAdquiridas = pedidos
    .filter((pedido) => STATUS_ADQUIRIDO.includes(pedido.status))
    .flatMap((pedido) => pedido.pedido_itens)
    .reduce((soma, item) => soma + item.quantidade, 0)

  const emAndamento = pedidos.filter((pedido) => STATUS_EM_ANDAMENTO.includes(pedido.status)).length

  const primeiroNome = perfil?.nome?.trim().split(/\s+/)[0]
  const ultimoPedido = pedidos[0]

  const numeros = [
    { rotulo: 'Obras adquiridas', valor: obrasAdquiridas },
    { rotulo: 'Pedidos em andamento', valor: emAndamento },
    { rotulo: 'Obras favoritas', valor: totalFavoritos ?? 0 },
  ]

  return (
    <>
      <Titulo overline="Bem-vindo(a)">{primeiroNome ? `Olá, ${primeiroNome}.` : 'Olá.'}</Titulo>

      <div className="mb-14 grid gap-5 sm:grid-cols-3">
        {numeros.map((numero) => (
          <div
            key={numero.rotulo}
            className="border border-linho bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,24,20,0.06)]"
          >
            <div className="mb-3 text-xs uppercase tracking-wider text-fumaca">{numero.rotulo}</div>
            <div className="font-serif text-3xl text-tinta">{numero.valor}</div>
          </div>
        ))}
      </div>

      {ultimoPedido ? (
        <div className="border border-linho bg-white px-6 py-7 md:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ouro">
                Pedido {codigoPedido(ultimoPedido.id)}
              </div>
              <div className="font-serif text-xl text-tinta">
                {ultimoPedido.pedido_itens[0]?.obra_titulo ?? 'Pedido'}
                {ultimoPedido.pedido_itens.length > 1 &&
                  ` e mais ${ultimoPedido.pedido_itens.length - 1}`}
              </div>
            </div>
            <Link
              href="/minha-conta/pedidos"
              className="shrink-0 rounded-sm border border-tinta px-5 py-2.5 text-[13px] text-tinta transition-colors duration-200 hover:bg-tinta hover:text-areia"
            >
              Ver todos os pedidos
            </Link>
          </div>

          <LinhaDoTempoPedido status={ultimoPedido.status} />

          {ultimoPedido.status === 'aguardando_pagamento' && (
            <div className="mt-7">
              <Botao variante="bordo" href={`/pedidos/${ultimoPedido.id}`}>
                Concluir pagamento
              </Botao>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-linho bg-white px-6 py-10 text-center md:px-8">
          <div className="mb-3 font-serif text-2xl italic text-tinta">Nenhum pedido ainda.</div>
          <p className="mb-7 text-sm text-fumaca">
            Quando você adquirir uma obra, o acompanhamento aparece aqui.
          </p>
          <Botao variante="secundario" href="/galeria">
            Ver a galeria
          </Botao>
        </div>
      )}
    </>
  )
}
