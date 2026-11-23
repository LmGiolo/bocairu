// Contato da artista — ÚNICO lugar que conhece o número do WhatsApp e o
// Instagram, e que sabe montar os links do WhatsApp. Trocar o número é
// mexer só aqui.
//
// O TEXTO das mensagens prontas saiu daqui: a artista edita em
// /admin/textos (chaves `whatsapp.*` de src/lib/textos.ts, onde estão os
// textos padrão). Este arquivo recebe a mensagem e monta o link.
//
// Arquivo puro (sem import de servidor nem de navegador), igual a
// src/lib/obras/formulario.ts: pode ser usado de qualquer lado.

// Formato internacional exigido pelo wa.me: código do país (55) + DDD (62)
// + número, só dígitos — sem "+", espaço, parêntese ou hífen.
const WHATSAPP_NUMERO = '5562996339044'

// Como o número aparece escrito na tela (não é usado no link).
export const WHATSAPP_EXIBICAO = '(62) 99633-9044'

const INSTAGRAM_USUARIO = 'isaviana.f'

export const INSTAGRAM_EXIBICAO = `@${INSTAGRAM_USUARIO}`
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_USUARIO}`

// O wa.me abre a conversa já com o texto digitado; a pessoa só aperta
// enviar. `encodeURIComponent` troca espaço, aspas, acento e "?" pelos
// códigos que podem ir numa URL — sem isso, a mensagem chega cortada.
function linkWhatsApp(mensagem: string) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`
}

// Link de quem clica no WhatsApp sem estar olhando uma foto específica
// (menu, Contato, Home, Rodapé). `mensagem` = textos['whatsapp.mensagem_geral'].
export function whatsAppUrlGeral(mensagem: string) {
  return linkWhatsApp(mensagem)
}

// Link de quem clica na Página de uma foto: interesse em COMPRAR aquela
// foto. O site não vende (vendas em standby, ver docs/handoff.md), mas a
// artista negocia direto pelo WhatsApp — por isso a mensagem leva o título
// e o link, pra ela saber exatamente de qual imagem se trata.
//
// `modelo` = textos['whatsapp.mensagem_foto'], com os marcadores {titulo} e
// {link}. O admin não deixa salvar sem {link}, mas se ele sumir mesmo assim
// (ex.: alguém gravou direto no banco), o link vai no fim — a artista nunca
// recebe uma mensagem sem saber de qual foto se trata.
export function whatsAppUrlSobreFoto(modelo: string, titulo: string, link: string) {
  let mensagem = modelo.replaceAll('{titulo}', titulo)
  mensagem = mensagem.includes('{link}') ? mensagem.replaceAll('{link}', link) : `${mensagem} ${link}`
  return linkWhatsApp(mensagem.trim())
}
