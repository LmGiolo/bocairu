'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import type { StatusObra } from '@/lib/obras/status'
import Aviso from '@/components/admin/Aviso'
import CabecalhoPagina from '@/components/admin/CabecalhoPagina'
import { CLASSE_BOTAO_PRIMARIO, CLASSE_BOTAO_TEXTO, CLASSE_CARTAO } from '@/components/admin/estilos'

export type ObraOrdenavel = {
  id: string
  titulo: string
  status: StatusObra
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
}

// Quantas fotos a Home usa, e pra quê — tem que bater com src/app/(site)/page.tsx
// (hero = catalogo[0], destaques = catalogo.slice(1, 4)).
const POSICOES_DESTAQUE = 3

function moverPara<T>(lista: T[], de: number, para: number): T[] {
  const copia = [...lista]
  const [item] = copia.splice(de, 1)
  copia.splice(para, 0, item)
  return copia
}

// A tela tem dois passos de propósito: (1) a artista arruma a ordem e vê a
// prévia; (2) só quando clica em "Salvar" o site muda. Até lá, nada foi
// gravado — dá pra mexer à vontade e desfazer.
//
// Só as fotos PUBLICADAS entram na numeração, porque são as únicas que o
// visitante vê: o número 1 aqui é exatamente a capa da Home. As fora do
// site aparecem embaixo, apagadas, só pra ela saber que existem.
export default function OrdenadorObras({ obras }: { obras: ObraOrdenavel[] }) {
  const router = useRouter()

  const publicadasIniciais = obras.filter((obra) => obra.status === 'publicada')
  const foraDoSite = obras.filter((obra) => obra.status !== 'publicada')

  const [ordem, setOrdem] = useState(publicadasIniciais)
  // Rascunho do número digitado em cada linha, por id. Só vira mudança de
  // posição quando ela confirma (Enter ou sair do campo) — senão, digitar
  // "12" passaria pela posição 1 no meio do caminho.
  const [digitando, setDigitando] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const mudou = ordem.some((obra, indice) => obra.id !== publicadasIniciais[indice]?.id)

  function mover(de: number, para: number) {
    const destino = Math.max(0, Math.min(ordem.length - 1, para))
    if (destino === de) return
    setOrdem((atual) => moverPara(atual, de, destino))
    setMensagem(null)
  }

  function confirmarNumero(id: string) {
    const texto = digitando[id]
    setDigitando((atual) => {
      const resto = { ...atual }
      delete resto[id]
      return resto
    })
    if (texto === undefined) return

    const numero = Number.parseInt(texto, 10)
    if (Number.isNaN(numero)) return

    // A artista pensa em posições começando do 1; a lista começa do 0.
    mover(
      ordem.findIndex((obra) => obra.id === id),
      numero - 1
    )
  }

  function desfazer() {
    setOrdem(publicadasIniciais)
    setDigitando({})
    setMensagem(null)
  }

  async function salvar() {
    setSalvando(true)
    setMensagem(null)

    // Publicadas ganham 1, 2, 3...; as fora do site vêm logo depois, na
    // ordem em que já estavam — se uma delas voltar a ser publicada, entra
    // no fim, igual a uma foto recém-cadastrada.
    const novasPosicoes = [...ordem, ...foraDoSite].map((obra, indice) => ({ id: obra.id, ordem: indice + 1 }))

    // Escreve direto pelo client do navegador: a policy `obras_update_admin`
    // (eh_admin()) é a fronteira de segurança, mesmo padrão da troca de
    // status em ListaObras.tsx. São vários UPDATEs, um por foto — NÃO é uma
    // transação: se a internet cair no meio, parte das fotos fica com a
    // posição nova e parte com a antiga. O estrago é só de ordem (nenhum
    // dado se perde) e salvar de novo resolve.
    const supabase = createClient()
    const resultados = await Promise.all(
      novasPosicoes.map(({ id, ordem: posicao }) => supabase.from('obras').update({ ordem: posicao }).eq('id', id))
    )

    setSalvando(false)

    const falhou = resultados.find((resultado) => resultado.error)
    if (falhou) {
      setMensagem({ tipo: 'erro', texto: 'Não deu pra salvar tudo. Confira a conexão e clique em Salvar de novo.' })
      return
    }

    setMensagem({ tipo: 'sucesso', texto: 'Ordem salva! O site já mostra as fotos nessa sequência.' })
    // Recarrega os dados do servidor: a "ordem inicial" passa a ser a salva,
    // e o botão Salvar volta a ficar desligado.
    router.refresh()
  }

  const capa = ordem[0]
  const destaques = ordem.slice(1, 1 + POSICOES_DESTAQUE)

  return (
    <div>
      <CabecalhoPagina
        sobretitulo="Site"
        titulo="Ordem do site"
        descricao={
          <>
            Digite o número da posição de cada foto (ou use as setas). A <strong className="text-tinta">1</strong> é a
            capa da Home, da <strong className="text-tinta">2</strong> à <strong className="text-tinta">4</strong> são
            os destaques, e a Galeria segue a mesma sequência. Confira a prévia e clique em{' '}
            <strong className="text-tinta">Salvar</strong> quando estiver do seu jeito — antes disso, nada muda no
            site.
          </>
        }
      />

      {ordem.length === 0 ? (
        <p className={`${CLASSE_CARTAO} px-6 py-12 text-center text-sm text-fumaca`}>
          Nenhuma foto publicada ainda. Publique uma em Obras para ordenar.
        </p>
      ) : (
        // `grid-cols-1` (= minmax(0, 1fr)) no celular: sem ele, a coluna única
        // cresceria até caber o título mais longo (que não quebra linha) e a
        // tela ganharia rolagem para o lado.
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* ───── Lista numerada ───── */}
          <div>
            <ol className={CLASSE_CARTAO}>
              {ordem.map((obra, indice) => (
                <li key={obra.id} className="flex items-center gap-3 border-b border-creme px-3 py-2.5 last:border-b-0 md:px-4">
                  <label className="sr-only" htmlFor={`posicao-${obra.id}`}>
                    Posição de {obra.titulo}
                  </label>
                  <input
                    id={`posicao-${obra.id}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={ordem.length}
                    value={digitando[obra.id] ?? String(indice + 1)}
                    onChange={(e) => setDigitando((atual) => ({ ...atual, [obra.id]: e.target.value }))}
                    onBlur={() => confirmarNumero(obra.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                    }}
                    className="w-16 shrink-0 rounded-sm border border-linho bg-areia px-2 py-2 text-center text-base transition-colors duration-200 focus:border-tinta"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin ainda sem next/image, ver docs/handoff.md §7 */}
                  <img src={obra.imagem_web} alt="" className="h-10 w-10 shrink-0 bg-linho object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{obra.titulo}</div>
                    <div className="text-xs text-fumaca">
                      {indice === 0 ? 'Capa da Home' : indice <= POSICOES_DESTAQUE ? 'Destaque da Home' : 'Galeria'}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => mover(indice, indice - 1)}
                      disabled={indice === 0}
                      aria-label={`Subir ${obra.titulo}`}
                      className="h-9 w-9 rounded-sm border border-linho text-sm transition-colors duration-200 hover:border-tinta disabled:opacity-30 disabled:hover:border-linho"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(indice, indice + 1)}
                      disabled={indice === ordem.length - 1}
                      aria-label={`Descer ${obra.titulo}`}
                      className="h-9 w-9 rounded-sm border border-linho text-sm transition-colors duration-200 hover:border-tinta disabled:opacity-30 disabled:hover:border-linho"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            {foraDoSite.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-2 text-[11px] uppercase tracking-[0.06em] text-fumaca">
                  Fora do site ({foraDoSite.length})
                </h2>
                <p className="mb-3 text-xs text-fumaca">
                  Rascunhos e arquivadas não aparecem para o visitante. Para colocar uma delas no site, mude o status
                  para “Publicada” em Obras — ela entra no fim da ordem.
                </p>
                <ul className={`${CLASSE_CARTAO} opacity-60`}>
                  {foraDoSite.map((obra) => (
                    <li key={obra.id} className="flex items-center gap-3 border-b border-creme px-3 py-2.5 last:border-b-0 md:px-4">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin ainda sem next/image */}
                      <img src={obra.imagem_web} alt="" className="h-10 w-10 shrink-0 object-cover" />
                      <span className="truncate text-sm">{obra.titulo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ───── Prévia de como o site vai ficar ───── */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <h2 className="mb-3 text-[11px] uppercase tracking-[0.06em] text-fumaca">Prévia</h2>
            <div className={`${CLASSE_CARTAO} p-4 md:p-5`}>
              <div className="mb-1.5 text-[11px] uppercase tracking-[0.06em] text-fumaca">Home — capa (1)</div>
              {capa && (
                <div className="relative mb-5 aspect-[16/9] overflow-hidden bg-tinta">
                  {/* eslint-disable-next-line @next/next/no-img-element -- prévia do admin */}
                  <img src={capa.imagem_web} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta/80 to-transparent p-3">
                    <span className="font-serif text-xl italic text-areia">Bocairú</span>
                  </div>
                </div>
              )}

              {destaques.length > 0 && (
                <>
                  <div className="mb-1.5 text-[11px] uppercase tracking-[0.06em] text-fumaca">
                    Home — destaques (2 a {1 + destaques.length})
                  </div>
                  <div className="mb-5 grid grid-cols-3 gap-2">
                    {destaques.map((obra) => (
                      <div key={obra.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- prévia do admin */}
                        <img src={obra.imagem_web} alt="" className="aspect-[4/5] w-full object-cover" />
                        <div className="mt-1 truncate text-[11px]">{obra.titulo}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mb-1.5 text-[11px] uppercase tracking-[0.06em] text-fumaca">Galeria</div>
              <div className="grid grid-cols-4 gap-1.5">
                {ordem.map((obra, indice) => (
                  <div key={obra.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- prévia do admin */}
                    <img src={obra.imagem_web} alt="" className="aspect-square w-full object-cover" />
                    <span className="absolute left-1 top-1 bg-tinta/80 px-1.5 text-[10px] text-areia">{indice + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-4 border-t border-linho bg-areia py-4">
        <button
          type="button"
          onClick={salvar}
          disabled={!mudou || salvando}
          className={CLASSE_BOTAO_PRIMARIO}
        >
          {salvando ? 'Salvando…' : 'Salvar e atualizar o site'}
        </button>
        <button
          type="button"
          onClick={desfazer}
          disabled={!mudou || salvando}
          className={CLASSE_BOTAO_TEXTO}
        >
          Desfazer alterações
        </button>
        {!mudou && !mensagem && <span className="text-xs text-fumaca">Nenhuma alteração ainda.</span>}
        {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}
      </div>
    </div>
  )
}
