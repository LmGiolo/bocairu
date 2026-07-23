'use client'

import { useRef, useState } from 'react'

import { precoParaCentavos, formatarCentavos } from '@/lib/obras/formulario'

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
  disponivel: boolean
  prazo_dias: string
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
  // Nasce disponível: é o caso comum, e espelha o default da coluna.
  return { id, rotulo: '', preco: '', disponivel: true, prazo_dias: '' }
}

export default function FormularioObra() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ano, setAno] = useState('')
  const [ficha, setFicha] = useState<Ficha>(FICHA_VAZIA)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [linhas, setLinhas] = useState<LinhaTamanho[]>([linhaNova(0)])
  const [status, setStatus] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Contador de ids. Fica num ref porque mudar ele não deve redesenhar a
  // tela — ele não é informação que aparece em lugar nenhum.
  const proximoId = useRef(1)

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

    // A ficha inteira: a chave do estado bate o nome do campo que o servidor
    // espera, então um laço só resolve os sete.
    for (const [campo, valor] of Object.entries(ficha)) {
      dados.append(campo, valor)
    }

    dados.append(
      'tamanhos',
      JSON.stringify(
        linhas.map(({ rotulo, preco, disponivel, prazo_dias }) => ({
          rotulo,
          preco,
          disponivel,
          prazo_dias,
        }))
      )
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
      setFicha(FICHA_VAZIA)
      setArquivo(null)
      setLinhas([linhaNova(proximoId.current++)])
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
