'use client'

import { useRef, useState } from 'react'

import { precoParaCentavos } from '@/lib/obras/formulario'

// Uma linha da lista de tamanhos, do jeito que ela existe na tela.
//
// O `id` não vem do banco nem vai pra ele: serve só como chave do React.
// Usar o índice do array como key daria bug — ao remover a linha do meio,
// o React reaproveitaria o estado da linha errada e o texto "pularia" de
// campo. O id é fixo desde que a linha nasce, então isso não acontece.
type LinhaTamanho = {
  id: number
  rotulo: string
  preco: string
}

// Formata centavos de volta pra moeda, só pra conferência na tela.
function formatarCentavos(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function FormularioObra() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ano, setAno] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [linhas, setLinhas] = useState<LinhaTamanho[]>([{ id: 0, rotulo: '', preco: '' }])
  const [status, setStatus] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Contador de ids. Fica num ref porque mudar ele não deve redesenhar a
  // tela — ele não é informação que aparece em lugar nenhum.
  const proximoId = useRef(1)

  function adicionarLinha() {
    setLinhas((atuais) => [...atuais, { id: proximoId.current++, rotulo: '', preco: '' }])
  }

  function removerLinha(id: number) {
    setLinhas((atuais) => atuais.filter((linha) => linha.id !== id))
  }

  function alterarLinha(id: number, campo: 'rotulo' | 'preco', valor: string) {
    setLinhas((atuais) =>
      atuais.map((linha) => (linha.id === id ? { ...linha, [campo]: valor } : linha))
    )
  }

  async function enviar() {
    if (!arquivo) {
      setStatus('Escolha uma imagem primeiro.')
      return
    }

    setEnviando(true)
    setStatus('Enviando... (o servidor ainda vai processar a imagem)')

    // FormData é como se manda arquivo por HTTP. Não dá pra usar JSON aqui:
    // JSON só carrega texto, e a imagem é binária. Os tamanhos, que são
    // estruturados, viajam como um campo de texto em JSON.
    const dados = new FormData()
    dados.append('arquivo', arquivo)
    dados.append('titulo', titulo)
    dados.append('descricao', descricao)
    dados.append('ano', ano)
    dados.append(
      'tamanhos',
      JSON.stringify(linhas.map(({ rotulo, preco }) => ({ rotulo, preco })))
    )

    try {
      const resposta = await fetch('/api/obras', {
        method: 'POST',
        body: dados,
        // Nada de header 'Content-Type' aqui: o navegador precisa montar ele
        // sozinho pra incluir o "boundary" que separa os campos do FormData.
      })

      const corpo = await resposta.json()

      if (!resposta.ok) {
        setStatus('Erro: ' + (corpo.erro ?? resposta.status))
        return
      }

      setStatus(
        `Pronto! "${corpo.obra.titulo}" criada com ${corpo.tamanhos.length} tamanho(s).`
      )
      setTitulo('')
      setDescricao('')
      setAno('')
      setArquivo(null)
      setLinhas([{ id: proximoId.current++, rotulo: '', preco: '' }])
    } catch {
      setStatus('Não consegui falar com o servidor.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', maxWidth: 560 }}>
      <h2>Nova obra</h2>

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
            <div key={linha.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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

              <span style={{ width: 110, fontSize: 13, alignSelf: 'center', color: '#666' }}>
                {centavos !== null && `${formatarCentavos(centavos)}`}
                {precoInvalido && <span style={{ color: 'crimson' }}>valor inválido</span>}
              </span>

              <button
                type="button"
                onClick={() => removerLinha(linha.id)}
                aria-label={`Remover tamanho ${linha.rotulo || 'sem rótulo'}`}
                style={{ padding: '6px 10px' }}
              >
                ✕
              </button>
            </div>
          )
        })}

        <button type="button" onClick={adicionarLinha} style={{ padding: 6, marginTop: 4 }}>
          + Adicionar tamanho
        </button>
      </fieldset>

      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
        />
      </div>

      <button onClick={enviar} disabled={enviando} style={{ padding: 8 }}>
        {enviando ? 'Enviando...' : 'Salvar obra'}
      </button>

      {status && <p>{status}</p>}
    </div>
  )
}
