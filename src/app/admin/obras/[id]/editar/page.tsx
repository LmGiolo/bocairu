import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import FormularioObra, { type ObraParaEdicao } from '@/components/admin/FormularioObra'
import type { StatusObra } from '@/lib/obras/status'

export default async function EditarObra({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Sem filtro de status: depende da policy `obras_select_admin` (RLS) pra
  // enxergar rascunho/arquivada também. Ver docs/handoff.md.
  const { data: obra, error } = await supabase
    .from('obras')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !obra) notFound()

  const obraParaEdicao: ObraParaEdicao = {
    id: obra.id,
    titulo: obra.titulo,
    descricao: obra.descricao ?? '',
    ano: obra.ano != null ? String(obra.ano) : '',
    ficha: {
      serie: obra.serie ?? '',
      historia_titulo: obra.historia_titulo ?? '',
      historia: obra.historia ?? '',
      tecnica: obra.tecnica ?? '',
      material: obra.material ?? '',
    },
    status: obra.status as StatusObra,
    imagemWebUrl: obra.imagem_web,
  }

  return (
    <div>
      <h1>Editar obra</h1>
      <FormularioObra obra={obraParaEdicao} />
    </div>
  )
}
