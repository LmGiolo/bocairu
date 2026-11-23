// Animações do site público (docs/handoff.md §4 e §7, item 4).
//
// Script que roda ANTES de a página ser pintada (ver src/app/layout.tsx) e
// marca o <html> com `data-js`. Todo o CSS de animação em globals.css começa
// por `[data-js]`: o estado "antes de entrar" (invisível, 12px abaixo) só
// existe quando há JavaScript para depois revelar o elemento. Sem JS, nada
// fica escondido esperando um observador que nunca vai rodar.
//
// Precisa ser texto puro: roda antes do React existir na página.
export const SCRIPT_ANIMACAO = `document.documentElement.setAttribute('data-js', '');`
