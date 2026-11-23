import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'

type Props = {
  nome: string
  imagemUrl: string
  larguraPx: number | null
  alturaPx: number | null
  contagem: number
  /** Posição na fileira — ver o mesmo campo em CartaoObra. */
  indice?: number
}

export default function CartaoSerie({ nome, imagemUrl, larguraPx, alturaPx, contagem, indice = 0 }: Props) {
  const aspectRatio = larguraPx && alturaPx ? `${larguraPx} / ${alturaPx}` : '4 / 5'

  // Ganchos de animação (`data-anim`, `anim-*`): ver CartaoObra.
  return (
    <Link
      href={`/colecoes/${encodeURIComponent(nome)}`}
      className="group block"
      data-anim="foto"
      style={{ '--i': indice } as CSSProperties}
    >
      <div
        className="anim-moldura relative w-full overflow-hidden border border-linho"
        style={{ aspectRatio }}
      >
        <Image
          src={imagemUrl}
          alt={nome}
          fill
          className="anim-foto-img object-cover"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="font-serif text-xl italic text-tinta">{nome}</span>
        <span className="text-xs text-fumaca">
          {contagem} obra{contagem === 1 ? '' : 's'}
        </span>
      </div>
    </Link>
  )
}
