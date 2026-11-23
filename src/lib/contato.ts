// Contato da artista — ÚNICO lugar que conhece o número do WhatsApp, o
// Instagram e o texto das mensagens prontas. Trocar o número ou reescrever
// uma mensagem é mexer só aqui; Contato, Home, Rodapé e a Página da Obra
// leem tudo deste arquivo.
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

// Mensagem de quem clica no WhatsApp sem estar olhando uma foto específica
// (Contato, Home, Rodapé).
const MENSAGEM_GERAL = 'Olá! Conheci seu trabalho pelo site e gostaria de conversar sobre uma sessão de fotos.'

// Mensagem de quem clica na Página de uma foto: interesse em COMPRAR aquela
// foto. O site não vende (vendas em standby, ver docs/handoff.md), mas a
// artista negocia direto pelo WhatsApp — por isso a mensagem já leva o
// título e o link, pra ela saber exatamente de qual imagem se trata.
function mensagemSobreFoto(titulo: string, link: string) {
  return `Olá! Vi a foto "${titulo}" no seu site e tenho interesse em comprá-la. Pode me passar mais informações? ${link}`
}

// O wa.me abre a conversa já com o texto digitado; a pessoa só aperta
// enviar. `encodeURIComponent` troca espaço, aspas, acento e "?" pelos
// códigos que podem ir numa URL — sem isso, a mensagem chega cortada.
function linkWhatsApp(mensagem: string) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`
}

export const WHATSAPP_URL_GERAL = linkWhatsApp(MENSAGEM_GERAL)

export function whatsAppUrlSobreFoto(titulo: string, link: string) {
  return linkWhatsApp(mensagemSobreFoto(titulo, link))
}
