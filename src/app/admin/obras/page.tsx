import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import PainelObras from '@/components/admin/PainelObras'
import Aviso from '@/components/admin/Aviso'
import type { ObraAdmin } from '@/components/admin/ListaObras'

export const metadata: Metadata = { title: 'Obras' }

export default async function AdminObras() {
  const supabase = await createClient()

  // Sem filtro de status: depende da policy `obras_select_admin` (RLS) pra
  // trazer rascunho/arquivada também — sem ela, esta lista mostra só as
  // obras publicadas (o mesmo que /galeria já mostra pro público). Ver
  // docs/handoff.md.
  //
  // Traz a ficha inteira (descrição, história, técnica...) e não só o que a
  // tabela mostra: a edição abre numa janela por cima da lista, sem ir ao
  // servidor de novo, então os dados já precisam estar aqui.
  const { data: obras, error } = await supabase
    .from('obras')
    .select('id, titulo, ano, serie, status, imagem_web, descricao, historia_titulo, historia, tecnica, material')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true })

  if (error) {
    return <Aviso tipo="erro">Erro ao carregar obras: {error.message}</Aviso>
  }

  return <PainelObras obras={(obras ?? []) as ObraAdmin[]} />
}
