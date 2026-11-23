import { createClient } from '@/lib/supabase/server'
import OrdenadorObras, { type ObraOrdenavel } from '@/components/admin/OrdenadorObras'

// Admin → Ordem do site: a artista decide em que posição cada foto aparece.
// O portão (sessão + papel admin) já roda em admin/layout.tsx.
export default async function OrdemDoSite() {
  const supabase = await createClient()

  // Sem filtro de status (depende da policy `obras_select_admin`): a tela
  // mostra também as fotos fora do site, pra artista saber que existem.
  // Desempate por `criado_em`: antes desta tela existir, todas as obras
  // tinham `ordem = 0` — aí vale a ordem em que foram cadastradas.
  const { data: obras, error } = await supabase
    .from('obras')
    .select('id, titulo, status, imagem_web, largura_px, altura_px')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson' }}>Erro ao carregar as fotos: {error.message}</p>
  }

  return <OrdenadorObras obras={(obras ?? []) as ObraOrdenavel[]} />
}
