import 'server-only'

import type { lerUsuario } from './sessao'
import type { StatusPedido } from '@/lib/pedidos/status'

type ClienteSupabase = Awaited<ReturnType<typeof lerUsuario>>['supabase']

export type ItemPedidoConta = {
  id: string
  obra_id: string | null
  obra_titulo: string
  tamanho_rotulo: string
  preco_centavos: number
  quantidade: number
  // A obra pode ter sido arquivada depois da compra — aí o RLS esconde a
  // linha de `obras` e o join volta null. O pedido continua inteiro,
  // porque título, tamanho e preço foram copiados pra pedido_itens na hora
  // da compra; só a miniatura some.
  obras: { imagem_web: string } | null
}

export type PedidoConta = {
  id: string
  status: StatusPedido
  total_centavos: number
  frete_centavos: number
  criado_em: string
  pedido_itens: ItemPedidoConta[]
}

// Pedidos do cliente logado, do mais recente pro mais antigo. Usado pelo
// Painel e por Meus Pedidos.
//
// O filtro por cliente_id NÃO é redundante com o RLS: a artista também tem
// uma policy (`pedidos_select_admin`) que libera TODOS os pedidos pra ela.
// Sem o filtro, a "Minha Conta" dela listaria os pedidos de todo mundo.
export async function lerPedidosDoCliente(
  supabase: ClienteSupabase,
  clienteId: string
): Promise<PedidoConta[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(
      'id, status, total_centavos, frete_centavos, criado_em, pedido_itens(id, obra_id, obra_titulo, tamanho_rotulo, preco_centavos, quantidade, obras(imagem_web))'
    )
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Não foi possível carregar os pedidos: ${error.message}`)
  }

  return (data ?? []) as unknown as PedidoConta[]
}
