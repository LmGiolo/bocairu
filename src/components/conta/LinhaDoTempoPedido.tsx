import { ETAPAS_PEDIDO, type StatusPedido } from '@/lib/pedidos/status'

// Acompanhamento do pedido, etapa por etapa (protótipo: Minha Conta.dc.html).
// Cada etapa tem três estados possíveis — concluída, atual (a próxima a
// acontecer) e pendente — e cada um tem ícone E texto escondido pra leitor
// de tela diferentes, não só cor.
export default function LinhaDoTempoPedido({ status }: { status: StatusPedido }) {
  if (status === 'cancelado') {
    return (
      <p className="flex items-start gap-3.5 text-sm text-[#B8492E]">
        <span aria-hidden="true" className="w-4">
          ✕
        </span>
        Pedido cancelado — o pagamento não foi concluído.
      </p>
    )
  }

  const indiceAtual = ETAPAS_PEDIDO.findIndex((etapa) => etapa.status === status)

  return (
    <ol className="flex flex-col gap-4">
      {ETAPAS_PEDIDO.map((etapa, indice) => {
        const concluida = indice <= indiceAtual
        const atual = indice === indiceAtual + 1

        return (
          <li key={etapa.status} className="flex items-start gap-3.5 text-sm">
            <span
              aria-hidden="true"
              className={`w-4 ${concluida ? 'text-[#2F5233]' : atual ? 'text-ouro' : 'text-linho'}`}
            >
              {concluida ? '✔' : atual ? '◐' : '○'}
            </span>
            <span className={concluida || atual ? 'text-tinta' : 'text-[#9C9280]'}>
              {etapa.rotulo}
              <span className="sr-only">
                {concluida ? ' — concluído' : atual ? ' — em andamento' : ' — pendente'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
