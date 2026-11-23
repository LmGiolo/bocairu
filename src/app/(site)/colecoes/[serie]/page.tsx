import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { criarClientPublico } from '@/lib/supabase/publico'
import GaleriaInterativa from '@/components/galeria/GaleriaInterativa'

// Lista vazia = nenhuma coleção montada no build; cada uma é montada na
// primeira visita e fica em cache (ver `revalidate` em ../../layout.tsx).
// Sem esta função, rota com [parâmetro] seria montada de novo a cada visita.
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serie: string }>
}): Promise<Metadata> {
  const { serie } = await params
  return {
    title: serie,
    description: `Série ${serie}, de Bocairú.`,
  }
}

export default async function Colecao({
  params,
}: {
  params: Promise<{ serie: string }>
}) {
  const { serie } = await params
  const supabase = criarClientPublico()

  // Mesma busca da /galeria: sem filtro de status (RLS decide o que é
  // visível) e catálogo inteiro de uma vez — a grade já sabe filtrar por
  // série no cliente via `serieInicial`, então não vale a pena duas rotas
  // de busca diferentes pra mesma coisa.
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
