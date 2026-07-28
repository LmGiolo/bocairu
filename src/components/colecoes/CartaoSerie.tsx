import Image from 'next/image'
import Link from 'next/link'

type Props = {
  nome: string
  imagemUrl: string
  larguraPx: number | null
  alturaPx: number | null
  contagem: number
}

export default function CartaoSerie({ nome, imagemUrl, larguraPx, alturaPx, contagem }: Props) {
  const aspectRatio = larguraPx && alturaPx ? `${larguraPx} / ${alturaPx}` : '4 / 5'

  return (
    <Link href={`/colecoes/${encodeURIComponent(nome)}`} className="group block">
      <div
        className="relative w-full overflow-hidden border border-linho"
        style={{ aspectRatio }}
      >
        <Image
          src={imagemUrl}
          alt={nome}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
