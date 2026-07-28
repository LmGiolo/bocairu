'use client'

import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type StatusEncomenda = 'nova' | 'em_conversa' | 'concluida' | 'arquivada'

export type Encomenda = {
  id: string
  nome: string
  email: string
  tipo_projeto: string
  mensagem: string
  status: StatusEncomenda
  criado_em: string
}

const ROTULOS_STATUS: Record<StatusEncomenda, string> = {
  nova: 'Nova',
  em_conversa: 'Em conversa',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
}

const ROTULOS_TIPO_PROJETO: Record<string, string> = {
  residencial: 'Residencial',
  corporativo: 'Corporativo',
  hospitalidade: 'Hospitalidade',
  nao_sei_ainda: 'Não sei ainda',
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// A escrita de status vai direto pro Supabase (client de sessão, não uma
// rota de API nova): quem está nesta tela já passou pelos dois portões do
// admin/layout.tsx, e a policy de UPDATE (eh_admin()) é a fronteira de
// segurança de verdade — não uma escrita pública sensível a preço, como em
// pedidos, que precisaria de outra checagem.
export default function ListaEncomendas({ encomendas }: { encomendas: Encomenda[] }) {
  const [linhas, setLinhas] = useState(encomendas)
  const [erroPorId, setErroPorId] = useState<Record<string, string>>({})
  const supabase = createClient()

  async function alterarStatus(id: string, statusNovo: StatusEncomenda) {
    const statusAnterior = linhas.find((l) => l.id === id)?.status

    // Otimista: a tela já reflete a troca antes da resposta do servidor.
    setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, status: statusNovo } : l)))
    setErroPorId((atuais) => ({ ...atuais, [id]: '' }))

    const { error } = await supabase.from('solicitacoes_encomenda').update({ status: statusNovo }).eq('id', id)

    if (error && statusAnterior) {
      // Desfaz a troca otimista e avisa qual linha falhou.
      setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, status: statusAnterior } : l)))
      setErroPorId((atuais) => ({ ...atuais, [id]: 'Falha ao salvar: ' + error.message }))
    }
  }

  if (linhas.length === 0) {
    return <p>Nenhuma solicitação de encomenda ainda.</p>
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
          <th style={{ padding: 8 }}>Data</th>
          <th style={{ padding: 8 }}>Nome</th>
          <th style={{ padding: 8 }}>E-mail</th>
          <th style={{ padding: 8 }}>Tipo de projeto</th>
          <th style={{ padding: 8 }}>Mensagem</th>
          <th style={{ padding: 8 }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha) => (
          <tr key={linha.id} style={{ borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
            <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{formatarData(linha.criado_em)}</td>
            <td style={{ padding: 8 }}>{linha.nome}</td>
            <td style={{ padding: 8 }}>{linha.email}</td>
            <td style={{ padding: 8 }}>{ROTULOS_TIPO_PROJETO[linha.tipo_projeto] ?? linha.tipo_projeto}</td>
            <td style={{ padding: 8, maxWidth: 320 }}>{linha.mensagem}</td>
            <td style={{ padding: 8 }}>
              <select
                value={linha.status}
                onChange={(e) => alterarStatus(linha.id, e.target.value as StatusEncomenda)}
              >
                {(Object.keys(ROTULOS_STATUS) as StatusEncomenda[]).map((status) => (
                  <option key={status} value={status}>
                    {ROTULOS_STATUS[status]}
                  </option>
                ))}
              </select>
              {erroPorId[linha.id] && (
                <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>{erroPorId[linha.id]}</div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
