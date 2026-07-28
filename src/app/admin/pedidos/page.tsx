import { createClient } from '@/lib/supabase/server'
import ListaPedidos from '@/components/admin/ListaPedidos'

// Client de sessão, não service role: a policy de SELECT nova
// (`pedidos_select_admin` / `pedido_itens_select_admin`, via eh_admin())
// já deixa quem passou pelos portões do admin/layout.tsx ler tudo.
export default async function AdminPedidos() {
  const supabase = await createClient()

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*, pedido_itens(*)')
    .order('criado_em', { ascending: false })

  if (error) {
    return <p style={{ color: 'crimson' }}>Erro ao carregar pedidos: {error.message}</p>
  }

  return (
    <div>
      <h1>Pedidos</h1>
      <ListaPedidos pedidos={pedidos ?? []} />
    </div>
  )
}
