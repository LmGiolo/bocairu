'use client'

import { useRef, useState } from 'react'

import { precoParaCentavos, formatarCentavos } from '@/lib/obras/formulario'
import { STATUS_OBRA, ROTULOS_STATUS_OBRA, type StatusObra } from '@/lib/obras/status'
import { PORTES, ROTULOS_PORTE, type Porte } from '@/lib/obras/porte'

// Uma linha da lista de tamanhos, do jeito que ela existe na tela.
//
// `id` não vem do banco nem vai pra ele: serve só como key do React (ver
// comentário de `linhaNova`). `tamanhoId` é o outro id, o de verdade — vem
// preenchido quando a linha já existe em `tamanhos` (modo edição) e fica
// `null` numa linha nova, que o servidor ainda vai inserir.
type LinhaTamanho = {
  id: number
  tamanhoId: string | null
  rotulo: string
  preco: string
  disponivel: boolean
  prazo_dias: string
  porte: Porte
}

// A ficha técnica da obra: sete campos de texto, todos opcionais. Ficam
// juntos num objeto só pra não virar sete useState quase idênticos.
type Ficha = {
  serie: string
  historia_titulo: string
  historia: string
  tecnica: string
  material: string
  impressao: string
  papel: string
}

const FICHA_VAZIA: Ficha = {
  serie: '',
  historia_titulo: '',
  historia: '',
  tecnica: '',
  material: '',
  impressao: '',
  papel: '',
}

function linhaNova(id: number): LinhaTamanho {
  // Nasce disponível e porte M: espelha o default das colunas.
  return { id, tamanhoId: null, rotulo: '', preco: '', disponivel: true, prazo_dias: '', porte: 'M' }
}

// Dados de uma obra já existente, no formato que a tela usa (preço como
// texto editável, não centavos — mesma conversão que o cadastro já faz).
// Passar `obra` liga o formulário no modo edição: PATCH em vez de POST,
// sem exigir arquivo, com o seletor de status visível.
export type ObraParaEdicao = {
  id: string
  titulo: string
  descricao: string
  ano: string
  ficha: Ficha
  status: StatusObra
  imagemWebUrl: string
  tamanhos: Array<{
    tamanhoId: string
    rotulo: string
    preco: string
    disponivel: boolean
    prazo_dias: string
    porte: Porte
  }>
}

export default function FormularioObra({ obra }: { obra?: ObraParaEdicao }) {
  const modoEdicao = obra !== undefined

  const [titulo, setTitulo] = useState(obra?.titulo ?? '')
  const [descricao, setDescricao] = useState(obra?.descricao ?? '')
  const [ano, setAno] = useState(obra?.ano ?? '')
  const [ficha, setFicha] = useState<Ficha>(obra?.ficha ?? FICHA_VAZIA)
  const [status, setStatus] = useState<StatusObra>(obra?.status ?? 'publicada')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [linhas, setLinhas] = useState<LinhaTamanho[]>(() =>
    obra && obra.tamanhos.length > 0
      ? obra.tamanhos.map((tamanho, indice) => ({ id: indice, ...tamanho }))
      : [linhaNova(0)]
  )
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Contador de ids. Fica num ref porque mudar ele não deve redesenhar a
  // tela — ele não é informação que aparece em lugar nenhum.
  const proximoId = useRef(linhas.length)

  function alterarFicha(campo: keyof Ficha, valor: string) {
    setFicha((atual) => ({ ...atual, [campo]: valor }))
  }

  function adicionarLinha() {
    setLinhas((atuais) => [...atuais, linhaNova(proximoId.current++)])
  }

  function removerLinha(id: number) {
    setLinhas((atuais) => atuais.filter((linha) => linha.id !== id))
  }

  function alterarLinha<K extends keyof LinhaTamanho>(
    id: number,
    campo: K,
    valor: LinhaTamanho[K]
  ) {
    setLinhas((atuais) =>
      atuais.map((linha) => (linha.id === id ? { ...linha, [campo]: valor } : linha))
    )
  }

  async function enviar() {
    if (!modoEdicao && !arquivo) {
      setMensagem('Escolha uma imagem primeiro.')
      return
    }

    setEnviando(true)
    setMensagem(modoEdicao ? 'Salvando...' : 'Enviando... (o servidor ainda vai processar a imagem)')

    // FormData é como se manda arquivo por HTTP. Não dá pra usar JSON aqui:
    // JSON só carrega texto, e a imagem é binária. Os tamanhos, que são
    // estruturados, viajam como um campo de texto em JSON. No modo edição
    // não há arquivo nenhum — o campo simplesmente não é anexado.
    const dados = new FormData()
    if (arquivo) dados.append('arquivo', arquivo)
    dados.append('titulo', titulo)
    dados.append('descricao', descricao)
    dados.append('ano', ano)
    if (modoEdicao) dados.append('status', status)

    // A ficha inteira: a chave do estado bate o nome do campo que o servidor
    // espera, então um laço só resolve os sete.
    for (const [campo, valor] of Object.entries(ficha)) {
      dados.append(campo, valor)
    }

    dados.append(
      'tamanhos',
      JSON.stringify(
        linhas.map(({ tamanhoId, rotulo, preco, disponivel, prazo_dias, porte }) => ({
          id: tamanhoId,
          rotulo,
          preco,
          disponivel,
          prazo_dias,
          porte,
        }))
      )
    )

    try {
      const resposta = await fetch(modoEdicao ? `/api/obras/${obra.id}` : '/api/obras', {
        method: modoEdicao ? 'PATCH' : 'POST',
        body: dados,
        // Nada de header 'Content-Type' aqui: o navegador precisa montar ele
        // sozinho pra incluir o "boundary" que separa os campos do FormData.
      })

      const corpo = await resposta.json()

      if (!resposta.ok) {
        setMensagem('Erro: ' + (corpo.erro ?? resposta.status))
        return
      }

      if (modoEdicao) {
        setMensagem(`Salvo! "${corpo.obra.titulo}" atualizada.`)

        // Tamanhos novos (sem tamanhoId) voltam do servidor com um id de
        // verdade. Casa cada um pela `ordem` — a mesma posição que a linha
        // tinha no array enviado — pra não depender da ordem em que o
        // Postgres devolve o INSERT.
        const inseridos: Array<{ id: string; ordem: number }> = corpo.tamanhosInseridos ?? []
        const porOrdem = new Map(inseridos.map((tamanho) => [tamanho.ordem, tamanho]))

        setLinhas((atuais) =>
          atuais.map((linha, indice) => {
            if (linha.tamanhoId) return linha
            const inserido = porOrdem.get(indice)
            return inserido ? { ...linha, tamanhoId: inserido.id } : linha
          })
        )
      } else {
        setMensagem(`Pronto! "${corpo.obra.titulo}" criada com ${corpo.tamanhos.length} tamanho(s).`)
        setTitulo('')
        setDescricao('')
        setAno('')
        setFicha(FICHA_VAZIA)
        setArquivo(null)
        setLinhas([linhaNova(proximoId.current++)])
      }
    } catch {
      setMensagem('Não consegui falar com o servidor.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', maxWidth: 560 }}>
      <h2>{modoEdicao ? 'Editar obra' : 'Nova obra'}</h2>

      {modoEdicao && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusObra)}
            style={{ padding: 6 }}
          >
            {STATUS_OBRA.map((valor) => (
              <option key={valor} value={valor}>
                {ROTULOS_STATUS_OBRA[valor]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ padding: 6, width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          style={{ padding: 6, width: '100%', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Ano (ex: 2024)"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          style={{ padding: 6, width: 140 }}
        />
      </div>

      <fieldset style={{ marginBottom: 16, padding: 12 }}>
        <legend>Ficha técnica</legend>

        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Série"
            value={ficha.serie}
            onChange={(e) => alterarFicha('serie', e.target.value)}
            style={{ padding: 6, width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Título da história"
            value={ficha.historia_titulo}
            onChange={(e) => alterarFicha('historia_titulo', e.target.value)}
            style={{ padding: 6, width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <textarea
            placeholder="História da obra"
            value={ficha.historia}
            onChange={(e) => alterarFicha('historia', e.target.value)}
            rows={4}
            style={{ padding: 6, width: '100%', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Técnica"
            value={ficha.tecnica}
            onChange={(e) => alterarFicha('tecnica', e.target.value)}
            style={{ padding: 6, flex: 1 }}
          />
          <input
            type="text"
            placeholder="Material"
            value={ficha.material}
            onChange={(e) => alterarFicha('material', e.target.value)}
            style={{ padding: 6, flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Impressão"
            value={ficha.impressao}
            onChange={(e) => alterarFicha('impressao', e.target.value)}
            style={{ padding: 6, flex: 1 }}
          />
          <input
            type="text"
            placeholder="Papel"
            value={ficha.papel}
            onChange={(e) => alterarFicha('papel', e.target.value)}
            style={{ padding: 6, flex: 1 }}
          />
        </div>
      </fieldset>

      <fieldset style={{ marginBottom: 16, padding: 12 }}>
        <legend>Tamanhos de impressão</legend>

        {linhas.length === 0 && (
          <p style={{ color: '#666' }}>Nenhum tamanho. Adicione pelo menos um.</p>
        )}

        {linhas.map((linha) => {
          // Roda o mesmo parser que o servidor vai rodar, então a
          // conferência na tela nunca discorda do que será salvo.
          const centavos = linha.preco.trim() ? precoParaCentavos(linha.preco) : null
          const precoInvalido = linha.preco.trim() !== '' && centavos === null

          return (
            <div
              key={linha.id}
              style={{
                border: '1px solid #eee',
                padding: 8,
                marginBottom: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Rótulo (ex: 30x40 cm)"
                  value={linha.rotulo}
                  onChange={(e) => alterarLinha(linha.id, 'rotulo', e.target.value)}
                  style={{ padding: 6, flex: 1 }}
                />

                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Preço (ex: 250,00)"
                  value={linha.preco}
                  onChange={(e) => alterarLinha(linha.id, 'preco', e.target.value)}
                  style={{
                    padding: 6,
                    width: 130,
                    borderColor: precoInvalido ? 'crimson' : undefined,
                  }}
                />

                <button
                  type="button"
                  onClick={() => removerLinha(linha.id)}
                  aria-label={`Remover tamanho ${linha.rotulo || 'sem rótulo'}`}
                  style={{ padding: '6px 10px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#666', minWidth: 90 }}>
                  {centavos !== null && formatarCentavos(centavos)}
                  {precoInvalido && <span style={{ color: 'crimson' }}>valor inválido</span>}
                </span>

                <input
                  type="text"
                  placeholder="Prazo (ex: 15 dias úteis)"
                  value={linha.prazo_dias}
                  onChange={(e) => alterarLinha(linha.id, 'prazo_dias', e.target.value)}
                  style={{ padding: 6, flex: 1 }}
                />

                <label style={{ fontSize: 13, display: 'flex', gap: 4, alignItems: 'center' }}>
                  Porte (frete)
                  <select
                    value={linha.porte}
                    onChange={(e) => alterarLinha(linha.id, 'porte', e.target.value as Porte)}
                  >
                    {PORTES.map((porte) => (
                      <option key={porte} value={porte}>
                        {ROTULOS_PORTE[porte]}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ fontSize: 13, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={linha.disponivel}
                    onChange={(e) => alterarLinha(linha.id, 'disponivel', e.target.checked)}
                  />
                  Disponível
                </label>
              </div>
            </div>
          )
        })}

        <button type="button" onClick={adicionarLinha} style={{ padding: 6, marginTop: 4 }}>
          + Adicionar tamanho
        </button>
      </fieldset>

      {modoEdicao ? (
        <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin ainda sem next/image, ver docs/handoff.md §7 */}
          <img src={obra.imagemWebUrl} alt={obra.titulo} style={{ width: 64, height: 64, objectFit: 'cover' }} />
          <span style={{ fontSize: 13, color: '#666' }}>
            Trocar a imagem ainda não é suportado por aqui.
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      <button onClick={enviar} disabled={enviando} style={{ padding: 8 }}>
        {enviando ? 'Enviando...' : modoEdicao ? 'Salvar alterações' : 'Salvar obra'}
      </button>

      {mensagem && <p>{mensagem}</p>}
    </div>
  )
}
