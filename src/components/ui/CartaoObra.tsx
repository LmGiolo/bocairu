import Image from 'next/image'
import Link from 'next/link'

type Props = {
  href: string
  imagemUrl: string
  titulo: string
  subtitulo: string
  /** Texto alternativo descritivo (técnica + composição). Sem isso, cai no título. */
  alt?: string
  status?: string
  precoLabel?: string
  /**
   * Dimensões em pixels da imagem web (colunas `largura_px`/`altura_px` de
   * `obras`, gravadas no upload a partir do que o sharp devolve depois de
   * rotacionar e redimensionar). A grade nunca força crop quadrado — sem
   * as duas, cai num 4/5 razoável (obras cadastradas antes dessas colunas
   * existirem).
   */
  larguraPx?: number | null
  alturaPx?: number | null
}

export default function CartaoObra({
  href,
  imagemUrl,
  titulo,
  subtitulo,
  alt,
  status,
  precoLabel,
  larguraPx,
  alturaPx,
}: Props) {
  const aspectRatio = larguraPx && alturaPx ? `${larguraPx} / ${alturaPx}` : '4 / 5'

  return (
    <div className="group">
      <Link href={href} className="block overflow-hidden border border-linho">
        <div className="relative w-full" style={{ aspectRatio }}>
          <Image
            src={imagemUrl}
            alt={alt || titulo}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        </div>
      </Link>

      <div className="pt-4">
        <Link
          href={href}
          className="text-sm font-medium text-tinta hover:underline"
        >
          {titulo}
        </Link>
        <div className="mt-0.5 text-xs text-fumaca">{subtitulo}</div>

        {(status || precoLabel) && (
          <div className="mt-1 flex items-center justify-between text-xs text-fumaca">
            {status && <span>{status}</span>}
            {precoLabel && <span className="text-tinta">{precoLabel}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
