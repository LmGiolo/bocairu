import { createClient } from '@/lib/supabase/server'
import CartaoSerie from '@/components/colecoes/CartaoSerie'

type ObraColecoes = {
  serie: string | null
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
}

type Serie = {
  nome: string
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
  contagem: number
}

export default async function Colecoes() {
  const supabase = await createClient()

  // Sem filtro de status: o RLS decide o que é visível pra quem não é admin
  // (mesma regra que /galeria e a Home já seguem — ver docs/handoff.md §8).
  const { data: obras, error } = await supabase
    .from('obras')
    .select('serie, imagem_web, largura_px, altura_px')
    .order('ordem', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson', padding: 40 }}>Erro: {error.message}</p>
  }

  const catalogo: ObraColecoes[] = obras ?? []

  // Uma "série" aqui é representada pela primeira obra dela (na ordem de
  // curadoria) — não existe tabela própria de séries, só a coluna
  // `obras.serie` (ver §9 do handoff).
  const series: Serie[] = []
  for (const obra of catalogo) {
    if (!obra.serie) continue
    if (series.some((s) => s.nome === obra.serie)) continue
    series.push({
      nome: obra.serie,
      imagem_web: obra.imagem_web,
      largura_px: obra.largura_px,
      altura_px: obra.altura_px,
      contagem: catalogo.filter((o) => o.serie === obra.serie).length,
    })
  }

  return (
    <div>
      <section className="mx-auto max-w-[1440px] px-6 pb-8 pt-16 md:px-12 lg:px-24">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
          {series.length} coleç{series.length === 1 ? 'ão' : 'ões'}
        </div>
        <h1 className="font-serif text-4xl text-tinta md:text-5xl">Coleções.</h1>
        <p className="mt-4 max-w-sm text-sm text-fumaca">
          Séries organizadas por narrativa visual — cada uma, um recorte diferente do olhar da
          artista.
        </p>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 lg:px-24">
        {series.length > 0 ? (
          <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((serie) => (
              <CartaoSerie
                key={serie.nome}
                nome={serie.nome}
                imagemUrl={serie.imagem_web}
                larguraPx={serie.largura_px}
                alturaPx={serie.altura_px}
                contagem={serie.contagem}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="mb-4 font-serif text-2xl italic text-tinta">Nenhuma coleção ainda.</div>
            <p className="text-sm text-fumaca">As obras ainda não foram organizadas em séries.</p>
          </div>
        )}
      </section>
    </div>
  )
}
