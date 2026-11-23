import Image from 'next/image'

// A miniatura 40×40 das listas do admin (Obras e Ordem do site).
//
// Por que não um <img> simples: o `imagem_web` de cada obra é a versão de
// 2000px (centenas de KB). Num <img>, o navegador baixa o arquivo inteiro
// para mostrar um quadradinho — numa lista com dezenas de fotos, isso dá
// vários MB, sentidos no celular da artista. O next/image pede ao servidor
// uma cópia reduzida e guarda essa cópia em cache.
//
// Sem `sizes`, `width` vira uma largura FIXA: o Next oferece só duas
// versões, uma para tela comum (1x) e uma para tela retina (2x). Pedimos
// 64px, e não 40, porque `object-cover` recorta: numa foto deitada (3:2),
// preencher 40px de ALTURA exige 60px de largura — com 40 ela sairia
// borrada.
export default function Miniatura({ src, className = '' }: { src: string; className?: string }) {
  return (
    <Image src={src} alt="" width={64} height={64} className={`h-10 w-10 shrink-0 object-cover ${className}`} />
  )
}
