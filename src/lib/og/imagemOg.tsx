import 'server-only'
import sharp from 'sharp'
import { ImageResponse } from 'next/og'

// Tamanho recomendado pela Meta para pré-visualização de link (proporção
// 1.91:1). É o que aparece no WhatsApp, no direct do Instagram, no link da
// bio e no Facebook quando alguém cola o endereço do site.
export const TAMANHO_OG = { width: 1200, height: 630 }

// Recorta uma foto do site no formato da pré-visualização.
//
// Por que sharp e não o ImageResponse (o jeito "padrão" do Next)? As fotos
// ficam no bucket em .webp, e o motor do ImageResponse não lê webp. O sharp
// — o mesmo que já gera a versão web no upload — lê, recorta e devolve um
// JPEG, que todo app de mensagem entende.
//
// `position: 'attention'` faz o sharp recortar em volta da parte mais
// "interessante" da imagem (contraste, cor, rosto) em vez de sempre pelo
// centro — numa foto vertical, o corte para 1200×630 perde muito, e isso
// ajuda a não decapitar ninguém.
//
// A versão aqui é bem menor que a de 2000px do site: compatível com a
// decisão de não usar marca d'água (a proteção é não espalhar arquivo grande).
export async function imagemOgDaFoto(urlDaFoto: string | null | undefined): Promise<Response> {
  if (urlDaFoto) {
    try {
      const resposta = await fetch(urlDaFoto)
      if (resposta.ok) {
        const original = Buffer.from(await resposta.arrayBuffer())
        const jpeg = await sharp(original)
          .resize({ ...TAMANHO_OG, fit: 'cover', position: 'attention' })
          .jpeg({ quality: 80 })
          .toBuffer()

        return new Response(new Uint8Array(jpeg), {
          headers: { 'Content-Type': 'image/jpeg' },
        })
      }
    } catch {
      // Cai na imagem de reserva logo abaixo: link compartilhado sem foto é
      // melhor do que link quebrado.
    }
  }

  return imagemOgReserva()
}

// Reserva para quando não há foto (catálogo vazio, bucket fora do ar): o
// nome em cima do fundo areia do design system. Esta sim usa ImageResponse —
// é só texto, nada de webp.
function imagemOgReserva(): Response {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F1EA',
          color: '#1B1814',
          fontSize: 120,
          fontStyle: 'italic',
          letterSpacing: '0.04em',
        }}
      >
        Bocairú
      </div>
    ),
    TAMANHO_OG
  )
}
