'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { atualizarSitePublico } from '@/app/admin/acoes'
import Miniatura from '@/components/admin/Miniatura'
import { createClient } from '@/lib/supabase/client'
import { STATUS_OBRA, ROTULOS_STATUS_OBRA, type StatusObra } from '@/lib/obras/status'
import { CLASSE_BOTAO_TEXTO, CLASSE_CARTAO } from '@/components/admin/estilos'

// Uma obra como o painel a recebe do banco: o que a tabela mostra mais a
// ficha completa, que a janela de edição usa.
export type ObraAdmin = {
  id: string
  titulo: string
  ano: number | null
  serie: string | null
  status: StatusObra
  imagem_web: string
  descricao: string | null
  historia_titulo: string | null
  historia: string | null
  tecnica: string | null
  material: string | null
}

type Filtro = 'todas' | StatusObra

// A ordem das pílulas: do que está no site para o que saiu dele. (A ordem
// de STATUS_OBRA é a do enum no banco, que começa por rascunho.)
const FILTROS: Filtro[] = ['todas', 'publicada', 'rascunho', 'arquivada']

// Rótulos das pílulas de filtro (no plural, diferente do <select> de status).
const ROTULOS_FILTRO: Record<Filtro, string> = {
  todas: 'Todas',
  publicada: 'Publicadas',
  rascunho: 'Rascunhos',
  arquivada: 'Arquivadas',
}

// Cor do status, no estilo das etiquetas do protótipo: verde = no site;
// as outras duas em tons neutros, porque "fora do site" não é erro.
const COR_STATUS: Record<StatusObra, string> = {
  publicada: 'bg-[#EAF1EA] text-[#2F5233]',
  rascunho: 'bg-creme text-tinta',
  arquivada: 'bg-[#F0EEE9] text-fumaca',
}

// As colunas da tabela a partir de 768px (`md`). Abaixo disso cada linha
// vira um bloco empilhado — ver a classe do <li>.
const COLUNAS = 'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_9.5rem_8.5rem] md:gap-4'

// A troca de status escreve direto no Supabase (client de sessão): a policy
// de UPDATE (`obras_update_admin`, via eh_admin()) já é a fronteira de
// segurança suficiente pra essa ação. "Publicada" põe a foto no site;
// "Rascunho" ou "Arquivada" tira, sem apagar nada. Edição de verdade
// (ficha técnica) é coisa demais pra um <select> otimista — fica na janela
// de edição, que passa pela rota com service role (ver
// src/app/api/obras/[id]/route.ts).
//
// Excluir é o oposto do <select>: não é otimista. Apagar mexe em banco e em
// dois buckets, e não tem volta — então a linha só some da tabela depois que
// o servidor confirma. Passa por DELETE /api/obras/[id], porque remover
// arquivo do bucket privado exige service role.
export default function ListaObras({
  obras,
  aoEditar,
}: {
  obras: ObraAdmin[]
  aoEditar: (obra: ObraAdmin) => void
}) {
  const [linhas, setLinhas] = useState(obras)
  const [erroPorId, setErroPorId] = useState<Record<string, string>>({})
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const router = useRouter()
  const supabase = createClient()

  // `useState(obras)` só usa `obras` na primeira vez. Quando o servidor
  // manda a lista de novo (router.refresh() depois de cadastrar ou editar
  // uma obra), a tabela precisa trocar pela lista nova — senão a obra
  // recém-cadastrada não apareceria. Este é o jeito que a documentação do
  // React recomenda pra "reiniciar estado quando a prop muda": comparar
  // durante a renderização, sem useEffect.
  const [obrasRecebidas, setObrasRecebidas] = useState(obras)
  if (obras !== obrasRecebidas) {
    setObrasRecebidas(obras)
    setLinhas(obras)
  }

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
      return
    }

    // Publicar/despublicar muda o site, que fica em cache: avisa para ele
    // ser remontado (sem isso, levaria até uma hora). Falha de rede aqui não
    // desfaz nada — o status já está salvo.
    await atualizarSitePublico().catch(() => {})
  }

  async function excluir(obra: ObraAdmin) {
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
    return (
      <div className={`${CLASSE_CARTAO} px-6 py-12 text-center text-sm text-fumaca`}>
        Nenhuma obra cadastrada ainda. Clique em <strong className="text-tinta">+ Nova obra</strong> para começar.
      </div>
    )
  }

  const contagem: Record<Filtro, number> = {
    todas: linhas.length,
    publicada: linhas.filter((l) => l.status === 'publicada').length,
    rascunho: linhas.filter((l) => l.status === 'rascunho').length,
    arquivada: linhas.filter((l) => l.status === 'arquivada').length,
  }
  const visiveis = filtro === 'todas' ? linhas : linhas.filter((l) => l.status === filtro)

  return (
    <>
      {/* ───── Pílulas de filtro (a do protótipo era "Todas · Disponíveis") ───── */}
      <div role="group" aria-label="Filtrar por status" className="mb-6 flex flex-wrap gap-2.5">
        {FILTROS.map((valor) => {
          const ativo = filtro === valor
          return (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              aria-pressed={ativo}
              className={`rounded-full border px-[18px] py-2 text-[13px] transition-colors duration-200 ${
                ativo ? 'border-tinta bg-tinta text-areia' : 'border-linho bg-transparent text-tinta hover:border-tinta'
              }`}
            >
              {ROTULOS_FILTRO[valor]} · {contagem[valor]}
            </button>
          )
        })}
      </div>

      <div className={CLASSE_CARTAO}>
        {/* Cabeçalho das colunas: só aparece quando há colunas (md+). */}
        <div
          aria-hidden="true"
          className={`hidden border-b border-linho px-6 py-3 text-[11px] uppercase tracking-[0.06em] text-fumaca ${COLUNAS}`}
        >
          <div>Obra</div>
          <div>Série</div>
          <div>Status</div>
          <div />
        </div>

        {visiveis.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-fumaca">Nenhuma obra com esse status.</p>
        ) : (
          <ul>
            {visiveis.map((obra) => (
              <li
                key={obra.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-creme px-4 py-3.5 text-sm last:border-b-0 md:px-6 ${COLUNAS}`}
              >
                {/* Obra: miniatura 40×40 + título e ano (e, no celular, a série). */}
                <div className="flex min-w-0 basis-full items-center gap-3 md:basis-auto">
                  <Miniatura src={obra.imagem_web} className="bg-linho" />
                  <div className="min-w-0">
                    <div className="truncate">{obra.titulo}</div>
                    <div className="text-xs text-fumaca">
                      {obra.ano ?? 'Sem ano'}
                      <span className="md:hidden">{obra.serie && ` · ${obra.serie}`}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden truncate text-fumaca md:block">{obra.serie ?? '—'}</div>

                {/* Status: um <select> com cara de etiqueta. A seta é desenho
                    (aria-hidden) porque o select perde a dele com appearance-none. */}
                <div className="relative w-fit">
                  <label htmlFor={`status-${obra.id}`} className="sr-only">
                    Status de {obra.titulo}
                  </label>
                  <select
                    id={`status-${obra.id}`}
                    value={obra.status}
                    onChange={(e) => alterarStatus(obra.id, e.target.value as StatusObra)}
                    className={`cursor-pointer appearance-none rounded-full border-0 py-1.5 pl-3.5 pr-8 text-xs ${COR_STATUS[obra.status]}`}
                  >
                    {STATUS_OBRA.map((valor) => (
                      <option key={valor} value={valor}>
                        {ROTULOS_STATUS_OBRA[valor]}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]">
                    ▾
                  </span>
                </div>

                <div className="ml-auto flex items-baseline gap-5 md:ml-0 md:justify-end">
                  <button
                    type="button"
                    onClick={() => aoEditar(obra)}
                    aria-label={`Editar ${obra.titulo}`}
                    className={CLASSE_BOTAO_TEXTO}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(obra)}
                    // Uma exclusão por vez: evita duas confirmações empilhadas
                    // e deixa claro qual linha está sendo apagada.
                    disabled={excluindoId !== null}
                    aria-label={`Excluir ${obra.titulo}`}
                    className={`${CLASSE_BOTAO_TEXTO} text-vinho`}
                  >
                    {excluindoId === obra.id ? 'Excluindo…' : 'Excluir'}
                  </button>
                </div>

                {erroPorId[obra.id] && (
                  <p role="alert" className="flex basis-full gap-2 text-xs text-vinho md:col-span-4">
                    <span aria-hidden="true">⚠</span>
                    {erroPorId[obra.id]}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
