'use client'

import Link from 'next/link'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { STATUS_OBRA, ROTULOS_STATUS_OBRA, type StatusObra } from '@/lib/obras/status'

export type ObraListada = {
  id: string
  titulo: string
  ano: number | null
  serie: string | null
  status: StatusObra
  imagem_web: string
}

// A troca de status escreve direto no Supabase (client de sessão): a policy
// de UPDATE (`obras_update_admin`, via eh_admin()) já é a fronteira de
// segurança suficiente pra essa ação. "Publicada" põe a foto no site;
// "Rascunho" ou "Arquivada" tira, sem apagar nada. Edição de verdade
// (ficha técnica) é coisa demais pra um <select> otimista — fica na tela de edição,
// que passa pela rota com service role (ver src/app/api/obras/[id]/route.ts).
export default function ListaObras({ obras }: { obras: ObraListada[] }) {
  const [linhas, setLinhas] = useState(obras)
  const [erroPorId, setErroPorId] = useState<Record<string, string>>({})
  const supabase = createClient()

  async function alterarStatus(id: string, statusNovo: StatusObra) {
    const statusAnterior = linhas.find((l) => l.id === id)?.status

    setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, status: statusNovo } : l)))
    setErroPorId((atuais) => ({ ...atuais, [id]: '' }))

    const { error } = await supabase
      .from('obras')
      .update({ status: statusNovo, atualizado_em: new Date().toISOString() })
      .eq('id', id)

    if (error && statusAnterior) {
      setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, status: statusAnterior } : l)))
      setErroPorId((atuais) => ({ ...atuais, [id]: 'Falha ao salvar: ' + error.message }))
    }
  }

  if (linhas.length === 0) {
    return <p>Nenhuma obra cadastrada ainda.</p>
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
          <th style={{ padding: 8 }}>Obra</th>
          <th style={{ padding: 8 }}>Série</th>
          <th style={{ padding: 8 }}>Status</th>
          <th style={{ padding: 8 }}></th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((obra) => {
          return (
            <tr key={obra.id} style={{ borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
              <td style={{ padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin ainda sem next/image, ver docs/handoff.md §7 */}
                  <img
                    src={obra.imagem_web}
                    alt=""
                    style={{ width: 40, height: 40, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div>
                    {obra.titulo}
                    {obra.ano && <div style={{ fontSize: 12, color: '#666' }}>{obra.ano}</div>}
                  </div>
                </div>
              </td>
              <td style={{ padding: 8, color: '#666' }}>{obra.serie ?? '—'}</td>
              <td style={{ padding: 8 }}>
                <select
                  value={obra.status}
                  onChange={(e) => alterarStatus(obra.id, e.target.value as StatusObra)}
                >
                  {STATUS_OBRA.map((valor) => (
                    <option key={valor} value={valor}>
                      {ROTULOS_STATUS_OBRA[valor]}
                    </option>
                  ))}
                </select>
                {erroPorId[obra.id] && (
                  <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>{erroPorId[obra.id]}</div>
                )}
              </td>
              <td style={{ padding: 8 }}>
                <Link href={`/admin/obras/${obra.id}/editar`} style={{ fontSize: 13, textDecoration: 'underline' }}>
                  Editar
                </Link>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
