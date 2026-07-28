'use client'

import { Fragment, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { formatarCentavos } from '@/lib/obras/formulario'
import { formatarData } from '@/lib/formatarData'
import type { EnderecoEntrega } from '@/lib/pedidos/formulario'
import { STATUS_PEDIDO, ROTULOS_STATUS_PEDIDO, type StatusPedido } from '@/lib/pedidos/status'

type ItemPedido = {
  id: string
  obra_titulo: string
  tamanho_rotulo: string
  preco_centavos: number
  quantidade: number
}

export type Pedido = {
  id: string
  cliente_nome: string
  cliente_email: string
  cliente_telefone: string
  endereco_entrega: EnderecoEntrega
  status: StatusPedido
  total_centavos: number
  observacoes: string | null
  criado_em: string
  pedido_itens: ItemPedido[]
}

// A escrita de status vai direto pro Supabase (client de sessão), igual
// ListaEncomendas.tsx já faz — a policy de UPDATE ("pedidos: admin
// atualiza status") já existia antes desta tela, não precisou de SQL novo
// pra essa parte. `atualizado_em` vai junto: sem isso a coluna fica parada
// desde a criação do pedido.
export default function ListaPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const [linhas, setLinhas] = useState(pedidos)
  const [erroPorId, setErroPorId] = useState<Record<string, string>>({})
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  async function alterarStatus(id: string, statusNovo: StatusPedido) {
    const statusAnterior = linhas.find((l) => l.id === id)?.status

    setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, status: statusNovo } : l)))
    setErroPorId((atuais) => ({ ...atuais, [id]: '' }))

    const { error } = await supabase
      .from('pedidos')
      .update({ status: statusNovo, atualizado_em: new Date().toISOString() })
      .eq('id', id)

    if (error && statusAnterior) {
      setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, status: statusAnterior } : l)))
      setErroPorId((atuais) => ({ ...atuais, [id]: 'Falha ao salvar: ' + error.message }))
    }
  }

  function alternarExpandido(id: string) {
    setExpandidos((atuais) => ({ ...atuais, [id]: !atuais[id] }))
  }

  if (linhas.length === 0) {
    return <p>Nenhum pedido ainda.</p>
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
          <th style={{ padding: 8 }}>Data</th>
          <th style={{ padding: 8 }}>Cliente</th>
          <th style={{ padding: 8 }}>Total</th>
          <th style={{ padding: 8 }}>Status</th>
          <th style={{ padding: 8 }}></th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((pedido) => (
          <Fragment key={pedido.id}>
            <tr style={{ borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
              <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{formatarData(pedido.criado_em)}</td>
              <td style={{ padding: 8 }}>
                <div>{pedido.cliente_nome}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{pedido.cliente_email}</div>
              </td>
              <td style={{ padding: 8 }}>{formatarCentavos(pedido.total_centavos)}</td>
              <td style={{ padding: 8 }}>
                <select
                  value={pedido.status}
                  onChange={(e) => alterarStatus(pedido.id, e.target.value as StatusPedido)}
                >
                  {STATUS_PEDIDO.map((status) => (
                    <option key={status} value={status}>
                      {ROTULOS_STATUS_PEDIDO[status]}
                    </option>
                  ))}
                </select>
                {erroPorId[pedido.id] && (
                  <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>
                    {erroPorId[pedido.id]}
                  </div>
                )}
              </td>
              <td style={{ padding: 8 }}>
                <button type="button" onClick={() => alternarExpandido(pedido.id)}>
                  {expandidos[pedido.id] ? 'Ocultar' : 'Ver detalhes'}
                </button>
              </td>
            </tr>
            {expandidos[pedido.id] && (
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td colSpan={5} style={{ padding: '8px 8px 20px 8px' }}>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Itens</strong>
                    <table style={{ width: '100%', marginTop: 6 }}>
                      <tbody>
                        {pedido.pedido_itens.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: '2px 8px 2px 0' }}>{item.obra_titulo}</td>
                            <td style={{ padding: '2px 8px', color: '#666' }}>
                              {item.tamanho_rotulo} · {item.quantidade}×
                            </td>
                            <td style={{ padding: '2px 0' }}>
                              {formatarCentavos(item.preco_centavos * item.quantidade)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>Entrega</strong>
                    <div>
                      {pedido.endereco_entrega.logradouro}, {pedido.endereco_entrega.numero}
                      {pedido.endereco_entrega.complemento
                        ? ` — ${pedido.endereco_entrega.complemento}`
                        : ''}{' '}
                      · {pedido.endereco_entrega.bairro} · {pedido.endereco_entrega.cidade}/
                      {pedido.endereco_entrega.estado} · CEP {pedido.endereco_entrega.cep}
                    </div>
                    <div>Telefone: {pedido.cliente_telefone}</div>
                  </div>

                  {pedido.observacoes && (
                    <div>
                      <strong>Observações</strong>
                      <div>{pedido.observacoes}</div>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
