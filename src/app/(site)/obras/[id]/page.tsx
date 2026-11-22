import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import CartaoObra from '@/components/ui/CartaoObra'
import FichaTecnica from '@/components/obra/FichaTecnica'
import { BotaoWhatsApp } from '@/components/contato/BotoesContato'
import { whatsAppUrlSobreFoto } from '@/lib/contato'

export default async function PaginaObra({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Sem filtro de status: o RLS decide o que é visível pra quem não é
  // admin, do mesmo jeito que a /galeria já faz.
  const { data: obra } = await supabase
    .from('obras')
    .select('*')
    .eq('id', id)
    .single()

  if (!obra) notFound()

  let relacionadas: Array<{
    id: string
    titulo: string
    tecnica: string | null
    imagem_web: string
    largura_px: number | null
    altura_px: number | null
  }> = []

  if (obra.serie) {
    const { data } = await supabase
      .from('obras')
      .select('id, titulo, tecnica, imagem_web, largura_px, altura_px')
      .eq('serie', obra.serie)
      .neq('id', obra.id)
      .order('ordem', { ascending: true })
      .order('criado_em', { ascending: true })
      .limit(4)

    relacionadas = data ?? []
  }

  // Endereço completo desta página, pra ir dentro da mensagem do WhatsApp
  // (a artista recebe o link e sabe na hora de qual foto se trata). Montado
  // a partir do próprio pedido — funciona igual em localhost, em preview e
  // no domínio final, sem variável de ambiente pra lembrar de configurar.
  const cabecalhos = await headers()
  const host = cabecalhos.get('host')
  const protocolo = cabecalhos.get('x-forwarded-proto') ?? 'https'
  const linkDaFoto = host ? `${protocolo}://${host}/obras/${obra.id}` : ''

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
        </div>

        <div>
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

          {/* O objetivo do portfólio: a foto vira conversa. A mensagem pronta
              já cita o título e o link desta página. */}
          <div className="border-t border-linho pt-8">
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-fumaca">
              Gostou desta foto? Converse com a artista sobre uma sessão nesse estilo.
            </p>
            <BotaoWhatsApp href={whatsAppUrlSobreFoto(obra.titulo, linkDaFoto)} />
          </div>
        </div>
      </section>

      {/* História da obra — só se a artista escreveu uma */}
      {obra.historia && (
        <section className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 md:py-32 lg:px-24 lg:py-40">
          <div className="max-w-2xl">
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
            {relacionadas.map((relacionada) => (
              <CartaoObra
                key={relacionada.id}
                href={`/obras/${relacionada.id}`}
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
