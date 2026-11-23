import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { criarClientPublico } from '@/lib/supabase/publico'
import CartaoObra from '@/components/ui/CartaoObra'
import FichaTecnica from '@/components/obra/FichaTecnica'
import { BotaoWhatsApp } from '@/components/contato/BotoesContato'
import { whatsAppUrlSobreFoto } from '@/lib/contato'
import { buscarObraPublica } from '@/lib/obras/publicas'
import { urlDoSite } from '@/lib/site'
import { lerConteudoSite } from '@/lib/textos-servidor'

// Lista vazia = nenhuma foto montada no build; cada Página da Obra é
// montada na primeira visita e fica em cache (ver `revalidate` em
// ../../layout.tsx). Sem esta função, rota com [parâmetro] seria montada de
// novo a cada visita.
export async function generateStaticParams() {
  return []
}

type ObraRelacionada = {
  id: string
  titulo: string
  tecnica: string | null
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
}

// Até 4 outras fotos da mesma série, na ordem do site. Foto sem série não
// tem relacionadas (nem consulta o banco).
async function buscarRelacionadas(serie: string | null, idAtual: string): Promise<ObraRelacionada[]> {
  if (!serie) return []
  const { data } = await criarClientPublico()
    .from('obras')
    .select('id, titulo, tecnica, imagem_web, largura_px, altura_px')
    .eq('serie', serie)
    .neq('id', idAtual)
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true })
    .limit(4)
  return data ?? []
}

// Título e descrição desta foto na aba do navegador e na pré-visualização
// do link (Open Graph). A imagem da pré-visualização vem do arquivo
// opengraph-image.tsx desta mesma pasta. Descrição: a da obra; sem ela, o
// começo da história; sem as duas, uma frase genérica.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  // Mesma busca da página logo abaixo: com o cache() de buscarObraPublica,
  // as duas juntas consultam o banco uma vez só.
  const obra = await buscarObraPublica(id)

  if (!obra) return {}

  const textoBase: string = obra.descricao || obra.historia || 'Fotografia de Bocairú.'
  // ~160 caracteres é o que os apps costumam mostrar antes de cortar.
  const descricao = textoBase.length > 160 ? `${textoBase.slice(0, 157).trimEnd()}…` : textoBase

  return {
    title: obra.titulo,
    description: descricao,
    openGraph: { title: obra.titulo, description: descricao },
  }
}

export default async function PaginaObra({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Sem filtro de status: o RLS só devolve obra publicada ao client
  // público (ver src/lib/obras/publicas.ts), como na /galeria.
  const obra = await buscarObraPublica(id)

  if (!obra) notFound()

  // As fotos da mesma série e os textos do site não dependem um do outro:
  // as duas consultas correm ao mesmo tempo, em vez de uma esperar a outra.
  const [relacionadas, { textos }] = await Promise.all([
    buscarRelacionadas(obra.serie, obra.id),
    // O modelo da mensagem (com {titulo} e {link}) é editável em /admin/textos.
    lerConteudoSite(),
  ])

  // Endereço completo desta página, pra ir dentro da mensagem do WhatsApp
  // (a artista recebe o link e sabe na hora de qual foto se trata). Vem de
  // urlDoSite() e não do endereço do pedido (headers()): ler o pedido
  // tiraria a página do cache. Em preview da Vercel, o link aponta para o
  // domínio de produção — que é onde o visitante de verdade está.
  const linkDaFoto = new URL(`/obras/${obra.id}`, urlDoSite()).toString()

  const proporcaoImagem =
    obra.largura_px && obra.altura_px ? `${obra.largura_px} / ${obra.altura_px}` : '4 / 5'

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto flex max-w-[1360px] flex-col gap-5 px-6 pt-10 md:px-12 lg:px-24">
        <Link
          href="/galeria"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-linho px-5 py-2.5 text-sm font-medium text-tinta transition-colors duration-200 hover:border-tinta"
        >
          ← Voltar à galeria
        </Link>
        <div className="text-sm text-fumaca">
          <Link href="/galeria" className="text-fumaca">
            Galeria
          </Link>
          {obra.serie && (
            <>
              {' / '}
              <Link href={`/colecoes/${encodeURIComponent(obra.serie)}`} className="text-fumaca">
                {obra.serie}
              </Link>
            </>
          )}
          {' / '}
          <span className="text-tinta">{obra.titulo}</span>
        </div>
      </div>

      {/* Split-screen: imagem + ficha */}
      <section className="mx-auto grid max-w-[1360px] gap-14 px-6 pt-8 md:grid-cols-[1.15fr_1fr] md:gap-16 md:px-12 lg:gap-22 lg:px-24">
        <div className="md:sticky md:top-24 md:self-start">
          {/* Mesmo `name` do cartão da galeria (CartaoObra): a foto clicada
              "voa" do cartão até aqui. De propósito, esta imagem NÃO tem
              animação de entrada própria — a passagem já é o movimento, e
              quem chega por link direto vê a foto na hora. */}
          <ViewTransition name={`foto-${obra.id}`} share="morph" default="none">
            <div
              className="relative w-full overflow-hidden border border-linho"
              style={{ aspectRatio: proporcaoImagem }}
            >
              <Image
                src={obra.imagem_web}
                alt={obra.titulo}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 768px) 55vw, 100vw"
              />
            </div>
          </ViewTransition>
        </div>

        <div data-anim="secao">
          {obra.serie && (
            <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-ouro">
              Série {obra.serie}
            </div>
          )}
          <h1 className="mb-2.5 font-serif text-4xl leading-tight text-tinta md:text-5xl">
            {obra.titulo}
          </h1>
          <div className="mb-10 text-sm text-fumaca">
            Bocairú{obra.ano ? `, ${obra.ano}` : ''}
          </div>

          {obra.descricao && (
            <p className="mb-10 max-w-md text-base leading-relaxed text-[#3A342C]">
              {obra.descricao}
            </p>
          )}

          <FichaTecnica tecnica={obra.tecnica} material={obra.material} />

          {/* O site não tem checkout: o interesse em comprar vira conversa no
              WhatsApp. A mensagem pronta já cita o título e o link desta página. */}
          <div className="border-t border-linho pt-8">
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-fumaca">
              Gostou desta foto? Fale com a artista para saber como adquiri-la.
            </p>
            <BotaoWhatsApp
              href={whatsAppUrlSobreFoto(textos['whatsapp.mensagem_foto'], obra.titulo, linkDaFoto)}
              rotulo="Tenho interesse nesta foto"
            />
          </div>
        </div>
      </section>

      {/* História da obra — só se a artista escreveu uma */}
      {obra.historia && (
        <section className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 md:py-32 lg:px-24 lg:py-40">
          <div className="max-w-2xl" data-anim="secao">
            <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-ouro">
              História da obra
            </div>
            {obra.historia_titulo && (
              <h2 className="mb-7 font-serif text-3xl text-tinta">{obra.historia_titulo}</h2>
            )}
            {obra.historia.split('\n\n').map((paragrafo: string, indice: number) => (
              <p key={indice} className="mb-5 text-[17px] leading-relaxed text-[#3A342C] last:mb-0">
                {paragrafo}
              </p>
            ))}
          </div>
        </section>
      )}

      {relacionadas.length > 0 && (
        <section className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 lg:px-24">
          <h2 className="mb-11 font-serif text-3xl text-tinta">Da mesma série.</h2>
          <div className="grid grid-cols-2 gap-7 md:grid-cols-4">
            {relacionadas.map((relacionada, indice) => (
              <CartaoObra
                key={relacionada.id}
                obraId={relacionada.id}
                indice={indice}
                imagemUrl={relacionada.imagem_web}
                titulo={relacionada.titulo}
                subtitulo={relacionada.tecnica ?? ''}
                larguraPx={relacionada.largura_px}
                alturaPx={relacionada.altura_px}
              />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
