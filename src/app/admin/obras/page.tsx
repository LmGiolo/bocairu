import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import ListaObras from '@/components/admin/ListaObras'

export default async function AdminObras() {
  const supabase = await createClient()

  // Sem filtro de status: depende da policy `obras_select_admin` (RLS) pra
  // trazer rascunho/arquivada também — sem ela, esta lista mostra só as
  // obras publicadas (o mesmo que /galeria já mostra pro público). Ver
  // docs/handoff.md.
  const { data: obras, error } = await supabase
    .from('obras')
    .select('id, titulo, ano, serie, status, imagem_web, tamanhos(preco_centavos)')
    .order('ordem', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson' }}>Erro ao carregar obras: {error.message}</p>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Obras</h1>
        <Link href="/admin">+ Nova obra</Link>
      </div>
      <ListaObras obras={obras ?? []} />
    </div>
  )
}
