import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import GaleriaInterativa from '@/components/galeria/GaleriaInterativa'

export default async function Colecao({
  params,
}: {
  params: Promise<{ serie: string }>
}) {
  const { serie } = await params
  const supabase = await createClient()

  // Mesma busca da /galeria: sem filtro de status (RLS decide o que é
  // visível) e catálogo inteiro de uma vez — a grade já sabe filtrar por
  // série no cliente via `serieInicial`, então não vale a pena duas rotas
  // de busca diferentes pra mesma coisa.
  const { data: obras, error } = await supabase
    .from('obras')
    .select(
      'id, titulo, ano, tecnica, serie, imagem_web, largura_px, altura_px, tamanhos(rotulo, preco_centavos, disponivel)'
    )
    .order('ordem', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson', padding: 40 }}>Erro: {error.message}</p>
  }

  const catalogo = obras ?? []

  // URL com nome de série que não existe no catálogo (link velho, digitação
  // errada) — não tem coleção nenhuma pra mostrar.
  if (!catalogo.some((obra) => obra.serie === serie)) {
    notFound()
  }

  return (
    <div>
      <div className="mx-auto max-w-[1440px] px-6 pt-10 md:px-12 lg:px-24">
        <Link
          href="/colecoes"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-linho px-5 py-2.5 text-sm font-medium text-tinta transition-colors duration-200 hover:border-tinta"
        >
          ← Todas as coleções
        </Link>
      </div>

      <GaleriaInterativa obras={catalogo} serieInicial={serie} />
    </div>
  )
}
