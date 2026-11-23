'use client'

import { useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import CartaoObra from '@/components/ui/CartaoObra'
import FiltroMultiplo, { type OpcaoFiltro } from './FiltroMultiplo'
import FiltrosCelular from './FiltrosCelular'

export type ObraGaleria = {
  id: string
  titulo: string
  ano: number | null
  tecnica: string | null
  serie: string | null
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
}

type Orientacao = 'vertical' | 'horizontal' | 'quadrada'

const ROTULO_ORIENTACAO: Record<Orientacao, string> = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
  quadrada: 'Quadrada',
}

function orientacaoDaObra(obra: ObraGaleria): Orientacao | null {
  if (!obra.largura_px || !obra.altura_px) return null

  const proporcao = obra.largura_px / obra.altura_px

  if (proporcao > 1.05) return 'horizontal'
  if (proporcao < 0.95) return 'vertical'
  return 'quadrada'
}

export default function GaleriaInterativa({
  obras,
  serieInicial,
}: {
  obras: ObraGaleria[]
  serieInicial: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()

  // Cada obra ganha, uma vez só, os campos que a UI precisa e que não vêm
  // prontos do banco: subtítulo e orientação (derivada da proporção real
  // da imagem).
  const obrasDerivadas = useMemo(
    () =>
      obras.map((obra) => ({
        ...obra,
        subtitulo: [obra.tecnica, obra.ano].filter(Boolean).join(' · '),
        orientacao: orientacaoDaObra(obra),
      })),
    [obras]
  )

  // Opções de filtro nascem do que existe nos dados — nada de lista fixa
  // com séries que talvez nem existam no catálogo agora.
  const opcoesSerie: OpcaoFiltro[] = useMemo(() => {
    const series = new Set(obras.map((o) => o.serie).filter((s): s is string => !!s))
    return [...series].sort().map((serie) => ({ valor: serie, texto: serie }))
  }, [obras])

  const opcoesOrientacao: OpcaoFiltro[] = useMemo(() => {
    const presentes = new Set(obrasDerivadas.map((o) => o.orientacao).filter((o): o is Orientacao => !!o))
    return (['vertical', 'horizontal', 'quadrada'] as const)
      .filter((orientacao) => presentes.has(orientacao))
      .map((orientacao) => ({ valor: orientacao, texto: ROTULO_ORIENTACAO[orientacao] }))
  }, [obrasDerivadas])

  const [serieSel, setSerieSel] = useState<string[]>(serieInicial ? [serieInicial] : [])
  const [orientacaoSel, setOrientacaoSel] = useState<string[]>([])
  const [busca, setBusca] = useState('')
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const gavetaFiltros = useRef<HTMLDialogElement>(null)

  const obrasFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase()

    return obrasDerivadas.filter((obra) => {
      if (serieSel.length && !(obra.serie && serieSel.includes(obra.serie))) return false
      if (orientacaoSel.length && !(obra.orientacao && orientacaoSel.includes(obra.orientacao))) return false
      if (buscaNormalizada && !obra.titulo.toLowerCase().includes(buscaNormalizada)) return false
      return true
    })
  }, [obrasDerivadas, serieSel, orientacaoSel, busca])

  const temFiltroAtivo = serieSel.length > 0 || orientacaoSel.length > 0 || busca.trim() !== ''
  // Quantas opções estão marcadas (sem contar a busca, que tem campo
  // próprio): aparece no botão "Filtros · 2" do celular.
  const quantosFiltros = serieSel.length + orientacaoSel.length

  function limparFiltros() {
    setSerieSel([])
    setOrientacaoSel([])
    setBusca('')
    setMenuAberto(null)
    router.replace(pathname)
  }

  const serieUnicaAtiva = serieSel.length === 1 ? serieSel[0] : null
  const contagemPlural = (n: number) => `${n} obra${n === 1 ? '' : 's'}`

  return (
    <div>
      {/* Cabeçalho de contexto */}
      <section className="mx-auto max-w-[1440px] px-6 pb-8 pt-16 md:px-12 lg:px-24" data-anim="secao">
        <div className="mb-4.5 text-xs font-semibold uppercase tracking-widest text-ouro">
          {serieUnicaAtiva
            ? `${contagemPlural(obrasFiltradas.length)} nesta coleção`
            : contagemPlural(obras.length)}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-serif text-4xl text-tinta md:text-5xl">
            {serieUnicaAtiva ? `${serieUnicaAtiva}.` : 'Galeria completa.'}
          </h1>
          <p className="max-w-sm text-sm text-fumaca">
            Uma seleção do trabalho fotográfico de Bocairú.
          </p>
        </div>
      </section>

      {/* Barra de filtros. Gruda logo abaixo do cabeçalho, que tem 73px no
          desktop (era 76px, e o conteúdo vazava por uma fresta de 3px) e
          65px abaixo de 1024px, onde ele vira uma linha só com o botão Menu.
          `barra-filtros`: gancho para acompanhar o cabeçalho quando ele
          encolhe ao rolar (globals.css).

          No celular (< 768px) a barra fica com uma linha só: a busca e o
          botão "Filtros", que abre a gaveta de baixo (FiltrosCelular). Os
          menus suspensos ficam do tablet pra cima. */}
      <section className="barra-filtros sticky top-[65px] z-30 border-b border-linho bg-areia lg:top-[73px]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between gap-3 py-3 md:flex-wrap md:gap-6 md:py-4.5">
            <div className="hidden flex-wrap items-center gap-2.5 md:flex">
              <button
                type="button"
                onClick={limparFiltros}
                disabled={!temFiltroAtivo}
                className={`rounded-full border px-4.5 py-2.5 text-sm transition-colors duration-200 ${
                  temFiltroAtivo ? 'cursor-pointer border-tinta text-tinta' : 'cursor-default border-linho text-pedra'
                }`}
              >
                Limpar filtros
              </button>

              <FiltroMultiplo
                rotulo="Coleção"
                opcoes={opcoesSerie}
                selecionados={serieSel}
                onChange={setSerieSel}
                aberto={menuAberto === 'serie'}
                onToggle={() => setMenuAberto((atual) => (atual === 'serie' ? null : 'serie'))}
                onFechar={() => setMenuAberto(null)}
              />

              <FiltroMultiplo
                rotulo="Orientação"
                opcoes={opcoesOrientacao}
                selecionados={orientacaoSel}
                onChange={setOrientacaoSel}
                aberto={menuAberto === 'orientacao'}
                onToggle={() => setMenuAberto((atual) => (atual === 'orientacao' ? null : 'orientacao'))}
                onFechar={() => setMenuAberto(null)}
              />
            </div>

            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por título…"
              aria-label="Buscar por título"
              className="min-w-0 flex-1 rounded-full border border-linho bg-white px-4 py-2.5 text-base transition-colors duration-200 focus:border-tinta md:w-52 md:flex-none md:text-sm"
            />

            {/* Só no celular. `text-base` na busca acima também é por causa
                dele: com fonte menor que 16px, o iPhone dá zoom na página
                ao tocar no campo. */}
            <button
              type="button"
              onClick={() => gavetaFiltros.current?.showModal()}
              aria-haspopup="dialog"
              className={`shrink-0 rounded-full border px-4.5 py-2.5 text-sm transition-colors duration-200 md:hidden ${
                quantosFiltros > 0 ? 'border-tinta bg-tinta text-areia' : 'border-linho text-tinta'
              }`}
            >
              Filtros{quantosFiltros > 0 ? ` · ${quantosFiltros}` : ''}
            </button>
          </div>

          {temFiltroAtivo && (
            <div className="pb-4 text-xs text-[#9C9280]">
              {contagemPlural(obrasFiltradas.length)} encontrada{obrasFiltradas.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </section>

      <FiltrosCelular
        ref={gavetaFiltros}
        grupos={[
          { rotulo: 'Coleção', opcoes: opcoesSerie, selecionados: serieSel, onChange: setSerieSel },
          { rotulo: 'Orientação', opcoes: opcoesOrientacao, selecionados: orientacaoSel, onChange: setOrientacaoSel },
        ]}
        encontradas={obrasFiltradas.length}
        temFiltroAtivo={quantosFiltros > 0}
        onLimpar={() => {
          setSerieSel([])
          setOrientacaoSel([])
          router.replace(pathname)
        }}
      />

      {/* Grade */}
      <section className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 lg:px-24">
        {obrasFiltradas.length > 0 ? (
          <div className="columns-1 gap-7 sm:columns-2 lg:columns-3">
            {obrasFiltradas.map((obra, indice) => (
              <div key={obra.id} className="mb-7 break-inside-avoid">
                <CartaoObra
                  obraId={obra.id}
                  indice={indice % 3}
                  imagemUrl={obra.imagem_web}
                  titulo={obra.titulo}
                  subtitulo={obra.subtitulo}
                  larguraPx={obra.largura_px}
                  alturaPx={obra.altura_px}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="mb-4 font-serif text-2xl italic text-tinta">Nenhuma obra encontrada.</div>
            <p className="mb-7 text-sm text-fumaca">Tente ajustar os filtros selecionados.</p>
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="rounded-sm border border-tinta px-6 py-3 text-sm text-tinta"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
