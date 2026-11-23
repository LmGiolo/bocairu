import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'
import Botao from '@/components/ui/Botao'
import CartaoObra from '@/components/ui/CartaoObra'
import CartaoSerie from '@/components/colecoes/CartaoSerie'
import { BotaoInstagram, BotaoWhatsApp } from '@/components/contato/BotoesContato'

type ObraHome = {
  id: string
  titulo: string
  ano: number | null
  tecnica: string | null
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

export default async function Home() {
  const supabase = await createClient()

  // Sem filtro de status: o RLS decide o que é visível pra quem não é admin
  // (mesma regra que /galeria e /obras/[id] já seguem — ver docs/handoff.md
  // §8). Busca tudo de uma vez, catálogo é curado e pequeno.
  const { data: obras, error } = await supabase
    .from('obras')
    .select('id, titulo, ano, tecnica, serie, imagem_web, largura_px, altura_px')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson', padding: 40 }}>Erro: {error.message}</p>
  }

  // A posição de cada foto vem da tela Admin → Ordem: a 1ª vira o hero, da
  // 2ª à 4ª, a faixa de destaque; a Galeria segue a mesma ordem.
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
      {/* Hero editorial — uma obra em tela cheia, sem carrossel.
          Ganchos (globals.css): `anim-hero` é a seção — e a presença dela
          na página é o que deixa o cabeçalho transparente por cima da foto;
          `anim-hero-foto` é a imagem (parallax); `anim-hero-texto` o nome e
          a frase (sobem ao entrar). `data-anim="capa"`: a entrada só
          começa quando a foto carregou. */}
      <section
        className="anim-hero relative h-[85vh] w-full overflow-hidden bg-tinta md:h-[70vh] lg:h-[100vh]"
        data-anim="capa"
      >
        {hero && (
          <Image
            src={hero.imagem_web}
            alt={hero.titulo}
            fill
            priority
            className="anim-hero-foto object-cover"
            sizes="100vw"
          />
        )}

        {/* Sombra leve no topo da foto: o cabeçalho transparente usa letras
            claras, e sem isso ele sumiria sobre uma foto de céu ou parede
            branca. Mesmo recurso do protótipo (Home.dc.html). */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-tinta/50 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta/85 via-tinta/25 to-transparent px-6 pb-14 pt-40 md:px-12 md:pb-16 lg:px-24">
          <div className="anim-hero-texto mx-auto max-w-[1440px]">
            <h1 className="font-serif text-6xl italic text-areia md:text-7xl">Bocairú</h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-areia/90 md:text-lg">
              Fotografia autoral. Sessões de foto sob agendamento.
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
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14" data-anim="secao">
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-ouro">
                Seleção atual
              </div>
              <h2 className="font-serif text-3xl text-tinta md:text-4xl">Três fotos, uma curadoria.</h2>
            </div>
            <Botao variante="terciario" href="/galeria">
              Ver toda a galeria →
            </Botao>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
            {destaque.map((obra, indice) => (
              <CartaoObra
                key={obra.id}
                obraId={obra.id}
                indice={indice}
                imagemUrl={obra.imagem_web}
                titulo={obra.titulo}
                subtitulo={[obra.tecnica, obra.ano].filter(Boolean).join(' · ')}
                larguraPx={obra.largura_px}
                alturaPx={obra.altura_px}
              />
            ))}
          </div>
        </section>
      )}

      {/* Séries/Coleções — navegação por narrativa visual */}
      {series.length > 0 && (
        <section className="bg-creme px-6 py-20 md:px-12 md:py-28 lg:px-24">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14" data-anim="secao">
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
              {series.map((serie, indice) => (
                <CartaoSerie
                  key={serie.nome}
                  indice={indice % 3}
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
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-20" data-anim="secao">
          {/* Sem foto de retrato no schema/ativos ainda — placeholder até
              existir uma imagem de verdade da artista. */}
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
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#3A342C]">
              Cada série nasce de um tempo longo de observação — paisagem, matéria e silêncio antes
              da câmera.
            </p>
            <Botao variante="secundario" href="/a-artista">
              Conhecer a artista
            </Botao>
          </div>
        </div>
      </section>

      {/* CTA final — o objetivo do portfólio: virar conversa no WhatsApp */}
      <section className="bg-creme px-6 py-24 text-center md:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl" data-anim="secao">
          <h2 className="mb-5 font-serif text-3xl text-tinta md:text-4xl">Vamos fotografar juntos?</h2>
          <p className="mb-9 text-base text-fumaca">
            Sessões de foto sob agendamento, combinadas direto com a artista.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <BotaoWhatsApp />
            <BotaoInstagram />
          </div>
        </div>
      </section>
    </div>
  )
}
