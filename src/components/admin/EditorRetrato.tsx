'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import Aviso, { type TipoAviso } from '@/components/admin/Aviso'
import { CLASSE_BOTAO_SECUNDARIO, CLASSE_BOTAO_TEXTO, CLASSE_ROTULO } from '@/components/admin/estilos'
import { RETRATOS, type LocalRetrato } from '@/lib/textos'

// O retrato de UMA página (Home, A Artista ou Contato) — cada página tem o
// seu, e este bloco aparece no topo do cartão dela em /admin/textos.
//
// Escolher a foto já envia — não há botão "Salvar" separado, porque não há
// nada para revisar antes: a prévia que aparece aqui é a mesma que o site
// vai mostrar. O envio passa pela rota /api/textos/retrato (service role),
// e não direto pelo navegador: o servidor converte a foto para webp e
// apaga o arquivo do retrato anterior daquela página.
export default function EditorRetrato({
  local,
  retratoInicial,
}: {
  local: LocalRetrato
  retratoInicial: string | null
}) {
  const router = useRouter()
  const [retrato, setRetrato] = useState(retratoInicial)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: TipoAviso; texto: string } | null>(null)

  async function enviar(arquivo: File | undefined) {
    if (!arquivo) return
    setOcupado(true)
    setAviso({ tipo: 'info', texto: 'Enviando… o servidor está preparando a foto.' })

    const dados = new FormData()
    dados.append('arquivo', arquivo)
    dados.append('local', local)

    try {
      const resposta = await fetch('/api/textos/retrato', { method: 'POST', body: dados })
      const corpo = await resposta.json().catch(() => null)
      if (!resposta.ok) {
        setAviso({ tipo: 'erro', texto: corpo?.erro ?? `O servidor recusou (erro ${resposta.status}).` })
        return
      }
      setRetrato(corpo.retratoUrl)
      setAviso({ tipo: 'sucesso', texto: 'Retrato trocado. A página já mostra a foto nova.' })
      router.refresh()
    } catch {
      setAviso({ tipo: 'erro', texto: 'Sem conexão com o servidor. Confira a internet e tente de novo.' })
    } finally {
      setOcupado(false)
    }
  }

  async function remover() {
    if (!window.confirm('Tirar o retrato desta página? Ela volta a mostrar a letra “B” no lugar.')) return
    setOcupado(true)
    setAviso(null)
    try {
      const resposta = await fetch(`/api/textos/retrato?local=${local}`, { method: 'DELETE' })
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null)
        setAviso({ tipo: 'erro', texto: corpo?.erro ?? 'Falha ao remover o retrato.' })
        return
      }
      setRetrato(null)
      setAviso({ tipo: 'sucesso', texto: 'Retrato removido.' })
      router.refresh()
    } catch {
      setAviso({ tipo: 'erro', texto: 'Sem conexão com o servidor. Confira a internet e tente de novo.' })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div>
      <div className={CLASSE_ROTULO}>Retrato</div>
      <div className="flex flex-wrap items-start gap-5">
        {/* Mesma moldura 4:5 do site. */}
        <div className="flex aspect-[4/5] w-32 shrink-0 items-center justify-center overflow-hidden border border-linho bg-creme">
          {retrato ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin sem next/image, ver docs/handoff.md §7
            <img src={retrato} alt="Retrato atual desta página" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true" className="font-serif text-5xl italic text-ouro">
              B
            </span>
          )}
        </div>

        <div className="flex min-w-0 max-w-sm flex-1 flex-col gap-3.5">
          <p className="text-[13px] leading-relaxed text-fumaca">
            Aparece {RETRATOS[local].onde}.{' '}
            {retrato ? 'Para trocar, escolha outra foto.' : 'Sem foto, a página mostra a letra “B”.'} A foto é
            cortada para a moldura vertical (4:5), mantendo o centro — e é salva na hora, sem precisar do botão
            Salvar.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            {/* O <label> faz o papel de botão: clicar nele abre o seletor de
                arquivos do <input> escondido dentro dele. */}
            <label
              className={`${CLASSE_BOTAO_SECUNDARIO} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ouro ${
                ocupado ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              {retrato ? 'Trocar foto' : 'Escolher foto'}
              <input
                type="file"
                accept="image/*"
                disabled={ocupado}
                onChange={(e) => {
                  enviar(e.target.files?.[0])
                  // Limpa o campo: escolher o mesmo arquivo de novo também
                  // dispara o envio.
                  e.target.value = ''
                }}
                className="sr-only"
              />
            </label>
            {retrato && (
              <button type="button" onClick={remover} disabled={ocupado} className={`${CLASSE_BOTAO_TEXTO} text-vinho`}>
                Remover retrato
              </button>
            )}
          </div>
          {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}
        </div>
      </div>
    </div>
  )
}
