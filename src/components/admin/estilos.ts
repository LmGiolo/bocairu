// Classes do painel administrativo, num lugar só. Os valores vêm de
// docs/prototipo/Admin.dc.html (botão 13px com padding 13/26, rótulo 12px em
// caixa alta, campo só com a linha de baixo). Ficam aqui, e não no
// componente Botao do site, porque o admin é mais compacto: o botão do site
// tem padding 16/36 e a animação de "preenchimento" das vitrines.

export const CLASSE_BOTAO_PRIMARIO =
  'inline-flex items-center justify-center gap-2 rounded-sm bg-tinta px-[26px] py-[13px] text-[13px] tracking-[0.03em] text-areia transition-colors duration-200 hover:bg-[#2C2721] disabled:cursor-not-allowed disabled:bg-creme disabled:text-pedra'

export const CLASSE_BOTAO_SECUNDARIO =
  'inline-flex items-center justify-center gap-2 rounded-sm border border-tinta bg-transparent px-[26px] py-[13px] text-[13px] tracking-[0.03em] text-tinta transition-colors duration-200 hover:bg-tinta hover:text-areia disabled:cursor-not-allowed disabled:opacity-40'

// Botão-link: sublinhado, sem caixa (o "Editar" da tabela). Sem cor própria
// de propósito — herda a do texto em volta, e quem usa pode somar uma
// (`text-vinho` no "Excluir") sem duas classes de cor brigando.
export const CLASSE_BOTAO_TEXTO =
  'cursor-pointer border-0 bg-transparent p-0 text-[13px] underline underline-offset-[3px] disabled:cursor-default disabled:opacity-40'

export const CLASSE_ROTULO = 'mb-1.5 block text-xs uppercase tracking-[0.06em] text-fumaca'

// Campo de uma linha: sem caixa, só o fio de baixo — escurece no foco.
// O contorno ouro de foco (globals.css) continua valendo por cima.
export const CLASSE_CAMPO =
  'w-full rounded-none border-0 border-b border-linho bg-transparent px-0.5 py-2.5 text-[15px] text-tinta transition-colors duration-200 placeholder:text-fumaca/60 focus:border-tinta'

// Texto longo: aí sim uma caixa branca, como a "Narrativa" do protótipo.
export const CLASSE_AREA_TEXTO =
  'w-full rounded-sm border border-linho bg-white p-3 text-[15px] leading-relaxed text-tinta transition-colors duration-200 placeholder:text-fumaca/60 focus:border-tinta'

// Cartão branco com fio linho: tabelas e blocos do painel.
export const CLASSE_CARTAO = 'border border-linho bg-white'
