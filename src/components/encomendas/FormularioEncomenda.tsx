'use client'

import { useState } from 'react'

import Botao from '@/components/ui/Botao'
import type { TipoProjeto } from '@/lib/encomendas/formulario'

const CLASSE_INPUT =
  'w-full border-b border-linho bg-transparent py-2.5 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta'
const CLASSE_LABEL = 'mb-1.5 block text-xs uppercase tracking-widest text-fumaca'

const TIPOS_PROJETO: Array<{ valor: TipoProjeto; rotulo: string }> = [
  { valor: 'residencial', rotulo: 'Residencial' },
  { valor: 'corporativo', rotulo: 'Corporativo' },
  { valor: 'hospitalidade', rotulo: 'Hospitalidade' },
  { valor: 'nao_sei_ainda', rotulo: 'Não sei ainda' },
]

export default function FormularioEncomenda() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [tipoProjeto, setTipoProjeto] = useState<TipoProjeto>('residencial')
  const [mensagem, setMensagem] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)

    let resposta: Response
    try {
      resposta = await fetch('/api/encomendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, tipoProjeto, mensagem }),
      })
    } catch {
      setErro('Falha de conexão. Tente de novo.')
      setEnviando(false)
      return
    }

    if (resposta.ok) {
      setEnviado(true)
      return
    }

    let corpo: { erro?: string }
    try {
      corpo = await resposta.json()
    } catch {
      corpo = {}
    }

    setErro(corpo.erro ?? 'Não foi possível enviar sua solicitação.')
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div className="border border-linho bg-white px-8 py-12 text-center">
        <div className="mb-3 font-serif text-2xl italic text-tinta">Solicitação recebida.</div>
        <p className="text-sm leading-relaxed text-fumaca">
          Retornamos em até 2 dias úteis para agendar uma conversa sobre o seu projeto.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-7">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className={CLASSE_LABEL} htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={CLASSE_INPUT}
          />
        </div>
        <div>
          <label className={CLASSE_LABEL} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASSE_INPUT}
          />
        </div>
      </div>

      <div>
        <div className={CLASSE_LABEL}>Tipo de projeto</div>
        <div className="flex flex-wrap gap-2.5">
          {TIPOS_PROJETO.map((tipo) => {
            const ativo = tipo.valor === tipoProjeto

            return (
              <button
                key={tipo.valor}
                type="button"
                onClick={() => setTipoProjeto(tipo.valor)}
                className={`rounded-full border px-4.5 py-2.5 text-sm transition-colors duration-200 ${
                  ativo ? 'border-tinta bg-tinta text-areia' : 'border-linho text-tinta hover:border-tinta'
                }`}
              >
                {tipo.rotulo}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className={CLASSE_LABEL} htmlFor="mensagem">
          Conte sobre o espaço
        </label>
        <textarea
          id="mensagem"
          required
          rows={4}
          placeholder="Ambiente, dimensões disponíveis, paleta de cores, referências..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          className="w-full border border-linho bg-white p-3 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta"
        />
      </div>

      {erro && (
        <div className="flex items-start gap-2.5 text-sm text-[#B8492E]">
          <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8492E]" />
          {erro}
        </div>
      )}

      <Botao variante="primario" type="submit" disabled={enviando} className="self-start">
        {enviando ? 'Enviando…' : 'Enviar solicitação'}
      </Botao>
    </form>
  )
}
