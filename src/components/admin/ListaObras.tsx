'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
//
// Excluir é o oposto do <select>: não é otimista. Apagar mexe em banco e em
// dois buckets, e não tem volta — então a linha só some da tabela depois que
// o servidor confirma. Passa por DELETE /api/obras/[id], porque remover
// arquivo do bucket privado exige service role.
export default function ListaObras({ obras }: { obras: ObraListada[] }) {
  const [linhas, setLinhas] = useState(obras)
  const [erroPorId, setErroPorId] = useState<Record<string, string>>({})
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const router = useRouter()
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

  async function excluir(obra: ObraListada) {
    // confirm() nativo: simples, acessível por teclado e leitor de tela, e
    // impossível de "clicar sem querer" junto com o botão.
    const confirmou = window.confirm(`Excluir "${obra.titulo}" para sempre? Isso não pode ser desfeito.`)
    if (!confirmou) return

    setExcluindoId(obra.id)
    setErroPorId((atuais) => ({ ...atuais, [obra.id]: '' }))

    try {
      const resposta = await fetch(`/api/obras/${obra.id}`, { method: 'DELETE' })

      // 404 também tira a linha: a obra já não existe (ex.: foi excluída em
      // outra aba), então mantê-la na lista só confundiria.
      if (resposta.ok || resposta.status === 404) {
        setLinhas((atuais) => atuais.filter((l) => l.id !== obra.id))
        // Pede ao servidor os dados frescos da página (o estado local acima
        // já resolveu a tabela; isto mantém o resto da tela coerente).
        router.refresh()
        return
      }

      // A rota sempre responde { erro } nos casos de falha — inclusive o 409
      // de "tem histórico de pedido; arquive em vez de excluir".
      const corpo: { erro?: string } | null = await resposta.json().catch(() => null)
      setErroPorId((atuais) => ({ ...atuais, [obra.id]: corpo?.erro ?? 'Falha ao excluir.' }))
    } catch {
      setErroPorId((atuais) => ({
        ...atuais,
        [obra.id]: 'Sem conexão com o servidor. Confira a internet e tente de novo.',
      }))
    } finally {
      setExcluindoId(null)
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
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <Link href={`/admin/obras/${obra.id}/editar`} style={{ fontSize: 13, textDecoration: 'underline' }}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => excluir(obra)}
                    // Uma exclusão por vez: evita duas confirmações empilhadas
                    // e deixa claro qual linha está sendo apagada.
                    disabled={excluindoId !== null}
                    aria-label={`Excluir ${obra.titulo}`}
                    style={{
                      fontSize: 13,
                      textDecoration: 'underline',
                      color: '#B8492E',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: excluindoId !== null ? 'default' : 'pointer',
                      opacity: excluindoId !== null && excluindoId !== obra.id ? 0.5 : 1,
                    }}
                  >
                    {excluindoId === obra.id ? 'Excluindo…' : 'Excluir'}
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
