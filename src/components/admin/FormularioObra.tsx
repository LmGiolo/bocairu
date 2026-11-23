'use client'

import { useState } from 'react'

import { STATUS_OBRA, ROTULOS_STATUS_OBRA, type StatusObra } from '@/lib/obras/status'

// A ficha técnica da obra: cinco campos de texto, todos opcionais. Ficam
// juntos num objeto só pra não virar cinco useState quase idênticos.
type Ficha = {
  serie: string
  historia_titulo: string
  historia: string
  tecnica: string
  material: string
}

const FICHA_VAZIA: Ficha = {
  serie: '',
  historia_titulo: '',
  historia: '',
  tecnica: '',
  material: '',
}

// Dados de uma obra já existente, no formato que a tela usa. Passar `obra` liga o formulário no modo edição: PATCH em vez de POST,
// sem exigir arquivo, com o seletor de status visível.
export type ObraParaEdicao = {
  id: string
  titulo: string
  descricao: string
  ano: string
  ficha: Ficha
  status: StatusObra
  imagemWebUrl: string
}

export default function FormularioObra({ obra }: { obra?: ObraParaEdicao }) {
  const modoEdicao = obra !== undefined

  const [titulo, setTitulo] = useState(obra?.titulo ?? '')
  const [descricao, setDescricao] = useState(obra?.descricao ?? '')
  const [ano, setAno] = useState(obra?.ano ?? '')
  const [ficha, setFicha] = useState<Ficha>(obra?.ficha ?? FICHA_VAZIA)
  const [status, setStatus] = useState<StatusObra>(obra?.status ?? 'publicada')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  function alterarFicha(campo: keyof Ficha, valor: string) {
    setFicha((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar() {
    if (!modoEdicao && !arquivo) {
      setMensagem('Escolha uma imagem primeiro.')
      return
    }

    setEnviando(true)
    setMensagem(modoEdicao ? 'Salvando...' : 'Enviando... (o servidor ainda vai processar a imagem)')

    // FormData é como se manda arquivo por HTTP. Não dá pra usar JSON aqui:
    // JSON só carrega texto, e a imagem é binária. No modo edição não há
    // arquivo nenhum — o campo simplesmente não é anexado.
    const dados = new FormData()
    if (arquivo) dados.append('arquivo', arquivo)
    dados.append('titulo', titulo)
    dados.append('descricao', descricao)
    dados.append('ano', ano)
    if (modoEdicao) dados.append('status', status)

    // A ficha inteira: a chave do estado bate o nome do campo que o servidor
    // espera, então um laço só resolve os cinco.
    for (const [campo, valor] of Object.entries(ficha)) {
      dados.append(campo, valor)
    }

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
      } else {
        setMensagem(`Pronto! "${corpo.obra.titulo}" publicada — ela entra no fim da ordem do site.`)
        setTitulo('')
        setDescricao('')
        setAno('')
        setFicha(FICHA_VAZIA)
        setArquivo(null)
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

        <div style={{ display: 'flex', gap: 8 }}>
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
