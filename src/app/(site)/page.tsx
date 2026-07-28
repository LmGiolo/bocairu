import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'
import Botao from '@/components/ui/Botao'
import CartaoObra from '@/components/ui/CartaoObra'
import CartaoSerie from '@/components/colecoes/CartaoSerie'
import { formatarCentavos } from '@/lib/obras/formulario'

type TamanhoObra = {
  preco_centavos: number
  disponivel: boolean
}

type ObraHome = {
  id: string
  titulo: string
  ano: number | null
  tecnica: string | null
  serie: string | null
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
  tamanhos: TamanhoObra[]
}

type Serie = {
  nome: string
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
  contagem: number
}

// Mesma derivação de "menor preço disponível" que a Galeria usa — preço
// mínimo entre os tamanhos disponíveis; se nenhum tamanho está disponível,
// cai no menor preço geral só pra não deixar o card sem número nenhum.
function derivarObra(obra: ObraHome) {
  const precosDisponiveis = obra.tamanhos.filter((t) => t.disponivel).map((t) => t.preco_centavos)
  const precos = obra.tamanhos.map((t) => t.preco_centavos)
  const precoMinimo = precosDisponiveis.length
    ? Math.min(...precosDisponiveis)
    : precos.length
      ? Math.min(...precos)
      : null

  return {
    subtitulo: [obra.tecnica, obra.ano].filter(Boolean).join(' · '),
    disponivel: obra.tamanhos.some((t) => t.disponivel),
    precoLabel: precoMinimo !== null ? `A partir de ${formatarCentavos(precoMinimo)}` : undefined,
  }
}

export default async function Home() {
  const supabase = await createClient()

  // Sem filtro de status: o RLS decide o que é visível pra quem não é admin
  // (mesma regra que /galeria e /obras/[id] já seguem — ver docs/handoff.md
  // §8). Busca tudo de uma vez, catálogo é curado e pequeno.
  const { data: obras, error } = await supabase
    .from('obras')
    .select('id, titulo, ano, tecnica, serie, imagem_web, largura_px, altura_px, tamanhos(preco_centavos, disponivel)')
    .order('ordem', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson', padding: 40 }}>Erro: {error.message}</p>
  }

  const catalogo: ObraHome[] = obras ?? []
  const hero = catalogo[0] ?? null
  const destaque = catalogo.slice(1, 4)

  // Uma "série" na Home é representada pela primeira obra dela (na ordem de
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
      {/* Hero editorial — uma obra em tela cheia, sem carrossel */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-tinta md:h-[70vh] lg:h-[100vh]">
        {hero && (
          <Image
            src={hero.imagem_web}
            alt={hero.titulo}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta/85 via-tinta/25 to-transparent px-6 pb-14 pt-40 md:px-12 md:pb-16 lg:px-24">
          <div className="mx-auto max-w-[1440px]">
            <h1 className="font-serif text-6xl italic text-areia md:text-7xl">Bocairú</h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-areia/90 md:text-lg">
              Fotografia fine art impressa sob encomenda — peça única para cada espaço.
            </p>
            <div className="mt-9">
              <Botao variante="primario" href="/galeria">
                Ver a galeria completa
              </Botao>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa de destaque — 3 obras selecionadas (as próximas na ordem de curadoria) */}
      {destaque.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28 lg:px-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
                Seleção atual
              </div>
              <h2 className="font-serif text-3xl text-tinta md:text-4xl">Três obras, uma curadoria.</h2>
            </div>
            <Botao variante="terciario" href="/galeria">
              Ver toda a galeria →
            </Botao>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
            {destaque.map((obra) => {
              const derivada = derivarObra(obra)
              return (
                <CartaoObra
                  key={obra.id}
                  href={`/obras/${obra.id}`}
                  imagemUrl={obra.imagem_web}
                  titulo={obra.titulo}
                  subtitulo={derivada.subtitulo}
                  status={derivada.disponivel ? 'Disponível' : 'Indisponível'}
                  precoLabel={derivada.precoLabel}
                  larguraPx={obra.largura_px}
                  alturaPx={obra.altura_px}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Séries/Coleções — navegação por narrativa visual */}
      {series.length > 0 && (
        <section className="bg-creme px-6 py-20 md:px-12 md:py-28 lg:px-24">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
              <div>
                <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
                  Séries
                </div>
                <h2 className="font-serif text-3xl text-tinta md:text-4xl">Navegue por narrativa.</h2>
              </div>
              <Botao variante="terciario" href="/colecoes">
                Ver todas as coleções →
              </Botao>
            </div>

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
          </div>
        </section>
      )}

      {/* Sobre a artista */}
      <section className="mx-auto max-w-[1360px] px-6 py-20 md:px-12 md:py-28 lg:px-24">
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          {/* Sem foto de retrato no schema/ativos ainda — placeholder no mesmo
              tratamento visual do selo do Certificado, até existir uma imagem
              de verdade pra artista. */}
          <div
            className="flex w-full items-center justify-center border border-linho bg-creme"
            style={{ aspectRatio: '4 / 5' }}
          >
            <span className="font-serif text-8xl italic text-ouro">B</span>
          </div>

          <div>
            <div className="mb-5 text-xs uppercase tracking-widest text-ouro">A artista</div>
            <h2 className="mb-6 max-w-md font-serif text-3xl text-tinta md:text-4xl">
              Bocairú fotografa o que a luz revela devagar.
            </h2>
            <p className="mb-4 max-w-md text-base leading-relaxed text-[#3A342C]">
              Cada série nasce de um tempo longo de observação — paisagem, matéria e silêncio antes
              da câmera. O resultado é uma fotografia fine art que se comporta como peça única, não
              como produto em série.
            </p>
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#3A342C]">
              Toda impressão é feita sob encomenda, em processo de padrão museológico, e chega
              assinada à mão.
            </p>
            <Botao variante="secundario" href="/a-artista">
              Conhecer a artista
            </Botao>
          </div>
        </div>
      </section>

      {/* Prova de confiança — certificado, processo, depoimentos */}
      <section className="bg-tinta px-6 py-20 text-areia md:px-12 md:py-28 lg:px-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 max-w-xl">
            <div className="mb-4 text-xs uppercase tracking-widest text-ouro">Confiança</div>
            <h2 className="font-serif text-3xl md:text-4xl">Cada obra chega pronta pra durar.</h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3 md:gap-10">
            <div>
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-ouro font-serif text-sm italic text-ouro">
                B
              </div>
              <h3 className="mb-3 text-base font-medium">Certificado de autenticidade</h3>
              <p className="text-sm leading-relaxed text-pedra">
                Toda obra chega assinada à mão, com certificado impresso e registro no arquivo da
                artista.
              </p>
            </div>

            <div>
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-ouro font-serif text-sm italic text-ouro">
                P
              </div>
              <h3 className="mb-3 text-base font-medium">Processo de produção</h3>
              <ol className="flex flex-col gap-1.5 text-sm leading-relaxed text-pedra">
                <li>01 · Curadoria de papel e acabamento</li>
                <li>02 · Impressão de padrão museológico</li>
                <li>03 · Assinatura e certificado</li>
                <li>04 · Envio cuidadoso, com rastreio</li>
              </ol>
            </div>

            <div>
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-ouro font-serif text-sm italic text-ouro">
                “
              </div>
              <h3 className="mb-3 text-base font-medium">O que dizem</h3>
              {/* Depoimentos-placeholder — trocar pelos primeiros relatos
                  reais de clientes assim que existirem. */}
              <div className="flex flex-col gap-5 text-sm leading-relaxed text-pedra">
                <p className="italic">
                  “A impressão chegou com uma qualidade que eu não esperava — parece ter mais
                  profundidade do que a foto na tela.”
                  <span className="mt-1 block not-italic text-xs text-pedra/70">
                    — Colecionadora particular, São Paulo
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final — encomenda sob medida */}
      <section className="px-6 py-24 text-center md:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-5 font-serif text-3xl text-tinta md:text-4xl">
            Uma peça pensada para o seu espaço.
          </h2>
          <p className="mb-9 text-base text-fumaca">
            Encomendas sob medida, em conversa direta com a artista.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Botao variante="bordo" href="/encomendas">
              Encomendar uma peça
            </Botao>
            <Botao variante="terciario" href="mailto:contato@bocairu.com">
              Ou escreva para a artista →
            </Botao>
          </div>
        </div>
      </section>
    </div>
  )
}
