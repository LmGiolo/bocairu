import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition, type CSSProperties } from 'react'

type Props = {
  obraId: string
  imagemUrl: string
  titulo: string
  subtitulo: string
  /** Texto alternativo descritivo (técnica + composição). Sem isso, cai no título. */
  alt?: string
  /**
   * Dimensões em pixels da imagem web (colunas `largura_px`/`altura_px` de
   * `obras`, gravadas no upload a partir do que o sharp devolve depois de
   * rotacionar e redimensionar). A grade nunca força crop quadrado — sem
   * as duas, cai num 4/5 razoável (obras cadastradas antes dessas colunas
   * existirem).
   */
  larguraPx?: number | null
  alturaPx?: number | null
  /**
   * Posição do cartão na fileira (0, 1, 2...). Vira a variável CSS `--i`,
   * que as animações usam para escalonar a entrada — um cartão logo depois
   * do outro, não todos juntos.
   */
  indice?: number
}

export default function CartaoObra({
  obraId,
  imagemUrl,
  titulo,
  subtitulo,
  alt,
  larguraPx,
  alturaPx,
  indice = 0,
}: Props) {
  const href = `/obras/${obraId}`
  const aspectRatio = larguraPx && alturaPx ? `${larguraPx} / ${alturaPx}` : '4 / 5'

  // As classes `anim-*` e o `data-anim` não estilizam nada sozinhos: são os
  // ganchos que o CSS de animação usa (globals.css).
  return (
    <div className="group" data-anim="foto" style={{ '--i': indice } as CSSProperties}>
      <Link href={href} className="anim-moldura block overflow-hidden border border-linho">
        {/* Mesmo `name` da foto na Página da Obra: ao clicar, o navegador
            entende que é a mesma imagem e a leva do cartão até lá. A
            `default="none"` impede essa moldura de animar em qualquer outra
            troca (entrar/sair da página) — ela só se mexe quando é a foto
            compartilhada. */}
        <ViewTransition name={`foto-${obraId}`} share="morph" default="none">
          <div className="relative w-full" style={{ aspectRatio }}>
            <Image
              src={imagemUrl}
              alt={alt || titulo}
              fill
              className="anim-foto-img object-cover"
              sizes="(min-width: 1024px) 33vw, 100vw"
            />
          </div>
        </ViewTransition>
      </Link>

      <div className="pt-4">
        <Link
          href={href}
          className="text-sm font-medium text-tinta hover:underline"
        >
          {titulo}
        </Link>
        <div className="mt-0.5 text-xs text-fumaca">{subtitulo}</div>
      </div>
    </div>
  )
}
