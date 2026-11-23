import Image from 'next/image'

// O retrato da artista, numa moldura 4:5 — usado na Home, em A Artista e no
// Contato. Sem retrato cadastrado (tela /admin/textos), mostra o "B"
// tipográfico que já era o placeholder dessas páginas.
//
// A foto preenche a moldura cortando o que sobra (object-cover): a artista
// pode mandar uma foto em qualquer proporção, e o centro dela aparece.
export default function Retrato({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center border border-linho bg-creme">
        <span aria-hidden="true" className="font-serif text-8xl italic text-ouro">
          B
        </span>
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-linho bg-creme">
      <Image
        src={url}
        alt="Retrato de Bocairú"
        fill
        // No celular a moldura ocupa a largura da tela; a partir de 768px,
        // é uma das duas colunas (~45% da tela, até ~600px).
        sizes="(min-width: 768px) 45vw, 100vw"
        className="object-cover"
      />
    </div>
  )
}
