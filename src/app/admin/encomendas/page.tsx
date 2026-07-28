import { createClient } from '@/lib/supabase/server'
import ListaEncomendas from '@/components/admin/ListaEncomendas'

// Lê com o client de sessão, não com service role: quem está aqui já
// passou pelos dois portões do admin/layout.tsx, e a policy de SELECT em
// `solicitacoes_encomenda` (eh_admin()) já deixa esse mesmo usuário ler as
// linhas direto. Service role só entraria se precisássemos ignorar RLS de
// propósito — não é o caso aqui.
export default async function AdminEncomendas() {
  const supabase = await createClient()

  const { data: encomendas, error } = await supabase
    .from('solicitacoes_encomenda')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) {
    return <p style={{ color: 'crimson' }}>Erro ao carregar solicitações: {error.message}</p>
  }

  return (
    <div>
      <h1>Encomendas</h1>
      <ListaEncomendas encomendas={encomendas ?? []} />
    </div>
  )
}
