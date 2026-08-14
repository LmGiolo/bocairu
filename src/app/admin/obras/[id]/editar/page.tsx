import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import FormularioObra, { type ObraParaEdicao } from '@/components/admin/FormularioObra'
import type { StatusObra } from '@/lib/obras/status'
import type { Porte } from '@/lib/obras/porte'

// Mesma conversão inversa de precoParaCentavos, mas sem o símbolo de moeda:
// o campo de preço do formulário espera um texto que ele próprio consiga
// reler ("250,00"), não "R$ 250,00".
function precoInicial(centavos: number) {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

export default async function EditarObra({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Sem filtro de status: depende da policy `obras_select_admin` (RLS) pra
  // enxergar rascunho/arquivada também, do mesmo jeito que /admin/pedidos
  // depende de `pedidos_select_admin`. Ver docs/handoff.md.
  const { data: obra, error } = await supabase
    .from('obras')
    .select('*, tamanhos(*)')
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
      impressao: obra.impressao ?? '',
      papel: obra.papel ?? '',
    },
    status: obra.status as StatusObra,
    imagemWebUrl: obra.imagem_web,
    tamanhos: [...obra.tamanhos]
      .sort((a, b) => a.ordem - b.ordem)
      .map((tamanho) => ({
        tamanhoId: tamanho.id,
        rotulo: tamanho.rotulo,
        preco: precoInicial(tamanho.preco_centavos),
        disponivel: tamanho.disponivel,
        prazo_dias: tamanho.prazo_dias ?? '',
        porte: tamanho.porte as Porte,
      })),
  }

  return (
    <div>
      <h1>Editar obra</h1>
      <FormularioObra obra={obraParaEdicao} />
    </div>
  )
}
