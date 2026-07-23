'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import CartaoObra from '@/components/ui/CartaoObra'
import { formatarCentavos } from '@/lib/obras/formulario'
import FiltroMultiplo, { type OpcaoFiltro } from './FiltroMultiplo'
import FiltroPreco from './FiltroPreco'

type TamanhoObra = {
  rotulo: string
  preco_centavos: number
  disponivel: boolean
}

export type ObraGaleria = {
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
  // prontos do banco: subtítulo, menor preço, disponibilidade e orientação
  // (esta última derivada da proporção real da imagem).
  const obrasDerivadas = useMemo(
    () =>
      obras.map((obra) => {
        const precosDisponiveis = obra.tamanhos.filter((t) => t.disponivel).map((t) => t.preco_centavos)
        const precos = obra.tamanhos.map((t) => t.preco_centavos)
        const precoMinimo = precosDisponiveis.length
          ? Math.min(...precosDisponiveis)
          : precos.length
            ? Math.min(...precos)
            : null

        return {
          ...obra,
          subtitulo: [obra.tecnica, obra.ano].filter(Boolean).join(' · '),
          disponivel: obra.tamanhos.some((t) => t.disponivel),
          precoMinimo,
          precoLabel: precoMinimo !== null ? `A partir de ${formatarCentavos(precoMinimo)}` : null,
          orientacao: orientacaoDaObra(obra),
        }
      }),
    [obras]
  )

  // Opções de filtro nascem do que existe nos dados — nada de lista fixa
  // com séries/tamanhos que talvez nem existam no catálogo agora.
  const opcoesSerie: OpcaoFiltro[] = useMemo(() => {
    const series = new Set(obras.map((o) => o.serie).filter((s): s is string => !!s))
    return [...series].sort().map((serie) => ({ valor: serie, texto: serie }))
  }, [obras])

  const opcoesTamanho: OpcaoFiltro[] = useMemo(() => {
    const rotulos = new Set(obras.flatMap((o) => o.tamanhos.map((t) => t.rotulo)))
    return [...rotulos].sort().map((rotulo) => ({ valor: rotulo, texto: rotulo }))
  }, [obras])

  const opcoesOrientacao: OpcaoFiltro[] = useMemo(() => {
    const presentes = new Set(obrasDerivadas.map((o) => o.orientacao).filter((o): o is Orientacao => !!o))
    return (['vertical', 'horizontal', 'quadrada'] as const)
      .filter((orientacao) => presentes.has(orientacao))
      .map((orientacao) => ({ valor: orientacao, texto: ROTULO_ORIENTACAO[orientacao] }))
  }, [obrasDerivadas])

  const precoMaximoCatalogo = useMemo(
    () => Math.max(0, ...obras.flatMap((o) => o.tamanhos.map((t) => t.preco_centavos))),
    [obras]
  )

  const [serieSel, setSerieSel] = useState<string[]>(serieInicial ? [serieInicial] : [])
  const [tamanhoSel, setTamanhoSel] = useState<string[]>([])
  const [orientacaoSel, setOrientacaoSel] = useState<string[]>([])
  const [precoMax, setPrecoMax] = useState(precoMaximoCatalogo)
  const [busca, setBusca] = useState('')
  const [menuAberto, setMenuAberto] = useState<string | null>(null)

  const obrasFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase()

    return obrasDerivadas.filter((obra) => {
      if (serieSel.length && !(obra.serie && serieSel.includes(obra.serie))) return false
      if (tamanhoSel.length && !obra.tamanhos.some((t) => tamanhoSel.includes(t.rotulo))) return false
      if (orientacaoSel.length && !(obra.orientacao && orientacaoSel.includes(obra.orientacao))) return false
      if (obra.precoMinimo !== null && obra.precoMinimo > precoMax) return false
      if (buscaNormalizada && !obra.titulo.toLowerCase().includes(buscaNormalizada)) return false
      return true
    })
  }, [obrasDerivadas, serieSel, tamanhoSel, orientacaoSel, precoMax, busca])

  const temFiltroAtivo =
    serieSel.length > 0 ||
    tamanhoSel.length > 0 ||
    orientacaoSel.length > 0 ||
    precoMax < precoMaximoCatalogo ||
    busca.trim() !== ''

  function limparFiltros() {
    setSerieSel([])
    setTamanhoSel([])
    setOrientacaoSel([])
    setPrecoMax(precoMaximoCatalogo)
    setBusca('')
    setMenuAberto(null)
    router.replace(pathname)
  }

  const serieUnicaAtiva = serieSel.length === 1 ? serieSel[0] : null
  const contagemPlural = (n: number) => `${n} obra${n === 1 ? '' : 's'}`

  return (
    <div>
      {/* Cabeçalho de contexto */}
      <section className="mx-auto max-w-[1440px] px-6 pb-8 pt-16 md:px-12 lg:px-24">
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
            Fotografia fine art e obras exclusivas, impressas sob encomenda.
          </p>
        </div>
      </section>

      {/* Barra de filtros */}
      <section className="sticky top-[76px] z-30 border-b border-linho bg-areia">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-24">
          <div className="flex flex-wrap items-center justify-between gap-6 py-4.5">
            <div className="flex flex-wrap items-center gap-2.5">
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
                rotulo="Tamanho"
                opcoes={opcoesTamanho}
                selecionados={tamanhoSel}
                onChange={setTamanhoSel}
                aberto={menuAberto === 'tamanho'}
                onToggle={() => setMenuAberto((atual) => (atual === 'tamanho' ? null : 'tamanho'))}
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

              <FiltroPreco
                max={precoMaximoCatalogo}
                valor={precoMax}
                onChange={setPrecoMax}
                aberto={menuAberto === 'preco'}
                onToggle={() => setMenuAberto((atual) => (atual === 'preco' ? null : 'preco'))}
                onFechar={() => setMenuAberto(null)}
              />
            </div>

            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por título…"
              className="w-52 rounded-full border border-linho bg-white px-4 py-2.5 text-sm transition-colors duration-200 focus:border-tinta"
            />
          </div>

          {temFiltroAtivo && (
            <div className="pb-4 text-xs text-[#9C9280]">
              {contagemPlural(obrasFiltradas.length)} encontrada{obrasFiltradas.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </section>

      {/* Grade */}
      <section className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 lg:px-24">
        {obrasFiltradas.length > 0 ? (
          <div className="columns-1 gap-7 sm:columns-2 lg:columns-3">
            {obrasFiltradas.map((obra) => (
              <div key={obra.id} className="mb-7 break-inside-avoid">
                <CartaoObra
                  href={`/obras/${obra.id}`}
                  imagemUrl={obra.imagem_web}
                  titulo={obra.titulo}
                  subtitulo={obra.subtitulo}
                  status={obra.disponivel ? 'Disponível' : 'Indisponível'}
                  precoLabel={obra.precoLabel ?? undefined}
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
