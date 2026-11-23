import type { Metadata } from 'next'

import { criarClientPublico } from '@/lib/supabase/publico'
import GaleriaInterativa from '@/components/galeria/GaleriaInterativa'

export const metadata: Metadata = {
  title: 'Galeria',
  description: 'Todas as fotografias do portfólio de Bocairú.',
}

// A Galeria não lê `searchParams` de propósito: ler a URL do pedido tira a
// página do cache (ver ../layout.tsx). O antigo `/galeria?serie=X` virou
// redirect para `/colecoes/X` no next.config.ts.
export default async function Galeria() {
  const supabase = criarClientPublico()

  // Busca tudo de uma vez — "catálogo curado, não vasto" (handoff §1), não
  // dá pra justificar paginação de servidor aqui. O RLS garante que só
  // vêm as obras "publicada"; não filtramos status no código.
  const { data: obras, error } = await supabase
    .from('obras')
    .select('id, titulo, ano, tecnica, serie, imagem_web, largura_px, altura_px')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true })

  if (error) {
    // Lançar o erro (em vez de desenhar uma mensagem) é o que protege o
    // cache: se o banco falhar na hora de remontar a página, o Next mantém
    // a versão anterior em vez de guardar uma página de erro por uma hora.
    throw new Error('Falha ao ler as fotos: ' + error.message)
  }

  return (
    <GaleriaInterativa
      obras={obras}
      serieInicial={null}
    />
  )
}
