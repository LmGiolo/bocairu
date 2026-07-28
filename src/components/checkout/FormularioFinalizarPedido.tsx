'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useCarrinho } from '@/components/carrinho/ContextoCarrinho'
import Botao from '@/components/ui/Botao'
import { formatarCentavos } from '@/lib/obras/formulario'

const CLASSE_INPUT =
  'w-full border-b border-linho bg-transparent py-2.5 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta'
const CLASSE_LABEL = 'mb-1.5 block text-xs uppercase tracking-widest text-fumaca'

type Props = {
  emailInicial: string
  nomeInicial: string
}

export default function FormularioFinalizarPedido({ emailInicial, nomeInicial }: Props) {
  const { itens, limpar } = useCarrinho()
  const router = useRouter()

  const [clienteNome, setClienteNome] = useState(nomeInicial)
  const [clienteEmail, setClienteEmail] = useState(emailInicial)
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const subtotal = itens.reduce((soma, item) => soma + item.precoCentavos * item.quantidade, 0)

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-24 text-center md:px-12 lg:px-24">
        <div className="mb-4 font-serif text-2xl italic text-tinta">Seu carrinho está vazio.</div>
        <p className="mb-8 text-sm text-fumaca">Encontre uma obra na galeria pra começar.</p>
        <Botao variante="secundario" href="/galeria">
          Ver a galeria
        </Botao>
      </div>
    )
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)

    let resposta: Response
    try {
      resposta = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome,
          clienteEmail,
          clienteTelefone,
          enderecoEntrega: { cep, logradouro, numero, complemento, bairro, cidade, estado },
          observacoes,
          itens: itens.map((item) => ({ tamanhoId: item.tamanhoId, quantidade: item.quantidade })),
        }),
      })
    } catch {
      setErro('Falha de conexão. Tente de novo.')
      setEnviando(false)
      return
    }

    // Uma resposta de erro que não é do formato { erro } (ex.: página de
    // erro genérica do Next, se a rota lançar uma exceção não tratada) não
    // é "falha de conexão" — a requisição chegou lá, só que algo quebrou
    // no servidor. As duas mensagens são propositalmente diferentes.
    let corpo: { erro?: string; pedido?: { id: string } }
    try {
      corpo = await resposta.json()
    } catch {
      setErro('Algo deu errado ao confirmar o pedido. Tente de novo em instantes.')
      setEnviando(false)
      return
    }

    if (!resposta.ok || !corpo.pedido) {
      setErro(corpo.erro ?? 'Não foi possível confirmar o pedido.')
      setEnviando(false)
      return
    }

    limpar()
    router.push(`/pedidos/${corpo.pedido.id}`)
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-16 md:px-12 md:py-20 lg:px-24">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
        Finalizar pedido
      </div>
      <h1 className="mb-10 font-serif text-4xl text-tinta md:mb-14 md:text-5xl">
        Um passo pra concluir.
      </h1>

      <div className="grid gap-14 md:grid-cols-[1fr_0.85fr] md:gap-16">
        <form onSubmit={enviar} className="flex flex-col gap-8">
          <div>
            <div className="mb-5 text-xs uppercase tracking-widest text-ouro">Contato</div>
            <div className="flex flex-col gap-6">
              <div>
                <label className={CLASSE_LABEL} htmlFor="nome">
                  Nome completo
                </label>
                <input
                  id="nome"
                  required
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className={CLASSE_INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={CLASSE_LABEL} htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    className={CLASSE_INPUT}
                  />
                </div>
                <div>
                  <label className={CLASSE_LABEL} htmlFor="telefone">
                    Telefone
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    required
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    className={CLASSE_INPUT}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-5 text-xs uppercase tracking-widest text-ouro">
              Endereço de entrega
            </div>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={CLASSE_LABEL} htmlFor="cep">
                    CEP
                  </label>
                  <input
                    id="cep"
                    required
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className={CLASSE_INPUT}
                  />
                </div>
                <div>
                  <label className={CLASSE_LABEL} htmlFor="numero">
                    Número
                  </label>
                  <input
                    id="numero"
                    required
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className={CLASSE_INPUT}
                  />
                </div>
              </div>

              <div>
                <label className={CLASSE_LABEL} htmlFor="logradouro">
                  Logradouro
                </label>
                <input
                  id="logradouro"
                  required
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className={CLASSE_INPUT}
                />
              </div>

              <div>
                <label className={CLASSE_LABEL} htmlFor="complemento">
                  Complemento (opcional)
                </label>
                <input
                  id="complemento"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className={CLASSE_INPUT}
                />
              </div>

              <div className="grid grid-cols-[1fr_1fr_80px] gap-5">
                <div>
                  <label className={CLASSE_LABEL} htmlFor="bairro">
                    Bairro
                  </label>
                  <input
                    id="bairro"
                    required
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className={CLASSE_INPUT}
                  />
                </div>
                <div>
                  <label className={CLASSE_LABEL} htmlFor="cidade">
                    Cidade
                  </label>
                  <input
                    id="cidade"
                    required
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className={CLASSE_INPUT}
                  />
                </div>
                <div>
                  <label className={CLASSE_LABEL} htmlFor="estado">
                    UF
                  </label>
                  <input
                    id="estado"
                    required
                    maxLength={2}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    className={`${CLASSE_INPUT} uppercase`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={CLASSE_LABEL} htmlFor="observacoes">
              Observações (opcional)
            </label>
            <textarea
              id="observacoes"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full border border-linho bg-white p-3 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta"
            />
          </div>

          {erro && (
            <div className="flex items-start gap-2.5 text-sm text-[#B8492E]">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8492E]" />
              {erro}
            </div>
          )}

          <Botao variante="bordo" type="submit" disabled={enviando}>
            {enviando ? 'Confirmando…' : 'Confirmar pedido'}
          </Botao>
        </form>

        <div className="h-fit border border-linho p-6">
          <div className="mb-5 text-xs uppercase tracking-widest text-fumaca">Resumo do pedido</div>
          <div className="flex flex-col gap-4">
            {itens.map((item) => (
              <div key={item.tamanhoId} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden border border-linho">
                  <Image src={item.imagemUrl} alt={item.titulo} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex flex-1 flex-col justify-center text-sm">
                  <span className="text-tinta">{item.titulo}</span>
                  <span className="text-xs text-fumaca">
                    {item.rotulo} · {item.quantidade}×
                  </span>
                </div>
                <div className="self-center text-sm text-tinta">
                  {formatarCentavos(item.precoCentavos * item.quantidade)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-baseline justify-between border-t border-linho pt-5">
            <span className="text-sm text-fumaca">Total estimado</span>
            <span className="font-serif text-2xl text-tinta">{formatarCentavos(subtotal)}</span>
          </div>
          <p className="mt-3 text-xs text-fumaca">
            O valor final é conferido no servidor ao confirmar — pode variar se algum preço mudou.
          </p>
        </div>
      </div>
    </div>
  )
}
