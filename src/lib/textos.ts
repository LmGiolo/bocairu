// Os textos do site que a artista edita em /admin/textos — a "voz" dela:
// Home, A Artista, Contato e as mensagens prontas do WhatsApp. Rótulos de
// botão, filtro e menu NÃO entram aqui de propósito (decisão do plano em
// docs/handoff.md §7, item 3): são interface, não conteúdo.
//
// Como funciona:
// - este catálogo é a lista oficial de textos, cada um com o texto PADRÃO
//   (o que o site mostrava antes da tela existir);
// - o banco (tabela `textos_site`) só guarda o que ela já reescreveu;
// - quem lê (src/lib/textos-servidor.ts) junta os dois: valor do banco se
//   houver, senão o padrão. O site nunca fica em branco.
//
// Arquivo puro (sem import de servidor nem de navegador): o admin, no
// navegador, usa o mesmo catálogo para montar o formulário.

export type GrupoTextos = 'home' | 'artista' | 'contato' | 'whatsapp'

type DefinicaoTexto = {
  grupo: GrupoTextos
  rotulo: string
  padrao: string
  // Multilinha: vira <textarea> no admin, e no site uma linha em branco
  // separa parágrafos (ver `paragrafos`).
  multilinha?: boolean
  // Dica curta embaixo do campo, no admin.
  dica?: string
}

export const CATALOGO_TEXTOS = {
  // ───── Home ─────
  'home.capa_frase': {
    grupo: 'home',
    rotulo: 'Frase da capa',
    padrao: 'Fotografia autoral. Sessões de foto sob agendamento.',
    dica: 'Aparece sobre a foto de capa, abaixo do nome — e também no rodapé de todas as páginas.',
  },
  'home.artista_titulo': {
    grupo: 'home',
    rotulo: 'Sobre a artista — título',
    padrao: 'Bocairú fotografa o que a luz revela devagar.',
  },
  'home.artista_texto': {
    grupo: 'home',
    rotulo: 'Sobre a artista — texto',
    padrao:
      'Cada série nasce de um tempo longo de observação — paisagem, matéria e silêncio antes da câmera.',
    multilinha: true,
  },
  'home.cta_titulo': {
    grupo: 'home',
    rotulo: 'Chamada final — título',
    padrao: 'Vamos fotografar juntos?',
  },
  'home.cta_texto': {
    grupo: 'home',
    rotulo: 'Chamada final — texto',
    padrao: 'Sessões de foto sob agendamento, combinadas direto com a artista.',
    multilinha: true,
  },

  // ───── A Artista ─────
  'artista.abertura_titulo': {
    grupo: 'artista',
    rotulo: 'Abertura — título',
    padrao: 'Bocairú.',
  },
  'artista.abertura_texto': {
    grupo: 'artista',
    rotulo: 'Abertura — texto',
    padrao:
      'Fotógrafa fine art. Trabalha em séries longas, voltando ao mesmo lugar ou ao mesmo tema até a imagem parar de mudar.',
    multilinha: true,
  },
  'artista.trajetoria_titulo': {
    grupo: 'artista',
    rotulo: 'Trajetória — título',
    padrao: 'Um olhar que espera antes de fotografar.',
  },
  'artista.trajetoria_texto': {
    grupo: 'artista',
    rotulo: 'Trajetória — texto',
    padrao:
      'Bocairú começou a fotografar tentando guardar um pouco do tempo que passava em paisagens que sabia que não veria de novo. Com os anos, essa urgência virou método: cada série nasce de uma permanência, não de uma visita.\n\n' +
      'O trabalho se move entre paisagem, retrato e natureza-morta, mas a pergunta é sempre a mesma — o que a luz revela quando a gente para de interferir. Não há ensaio nem direção, só a espera de um instante que já estava ali.',
    multilinha: true,
    dica: 'Deixe uma linha em branco entre um parágrafo e outro.',
  },
  'artista.processo_1_titulo': { grupo: 'artista', rotulo: 'Processo, etapa 1 — título', padrao: 'Observação' },
  'artista.processo_1_texto': {
    grupo: 'artista',
    rotulo: 'Processo, etapa 1 — texto',
    padrao: 'Tempo de convivência com o lugar ou o tema, sem câmera, antes de qualquer registro.',
    multilinha: true,
  },
  'artista.processo_2_titulo': { grupo: 'artista', rotulo: 'Processo, etapa 2 — título', padrao: 'Espera' },
  'artista.processo_2_texto': {
    grupo: 'artista',
    rotulo: 'Processo, etapa 2 — texto',
    padrao: 'Voltas sucessivas até a luz, a composição ou o gesto revelarem o que valia a pena guardar.',
    multilinha: true,
  },
  'artista.processo_3_titulo': { grupo: 'artista', rotulo: 'Processo, etapa 3 — título', padrao: 'Captura' },
  'artista.processo_3_texto': {
    grupo: 'artista',
    rotulo: 'Processo, etapa 3 — texto',
    padrao: 'Poucos cliques, decisão deliberada — nada de still life montado ou ensaio dirigido.',
    multilinha: true,
  },
  'artista.processo_4_titulo': { grupo: 'artista', rotulo: 'Processo, etapa 4 — título', padrao: 'Seleção' },
  'artista.processo_4_texto': {
    grupo: 'artista',
    rotulo: 'Processo, etapa 4 — texto',
    padrao: 'De uma série longa, só uma fração pequena sobrevive à curadoria final.',
    multilinha: true,
  },
  'artista.cta_titulo': {
    grupo: 'artista',
    rotulo: 'Chamada final — título',
    padrao: 'Conheça o trabalho completo.',
  },
  'artista.cta_texto': {
    grupo: 'artista',
    rotulo: 'Chamada final — texto',
    padrao: 'Cada coleção é um recorte diferente do mesmo olhar.',
    multilinha: true,
  },

  // ───── Contato ─────
  'contato.titulo': {
    grupo: 'contato',
    rotulo: 'Título',
    padrao: 'Vamos fotografar juntos?',
  },
  'contato.texto': {
    grupo: 'contato',
    rotulo: 'Texto de apresentação',
    padrao:
      'Para agendar uma sessão de fotos ou tirar dúvidas, a conversa é direto com a Bocairú, pelo WhatsApp. No Instagram você acompanha os trabalhos mais recentes.',
    multilinha: true,
  },

  // ───── WhatsApp ─────
  'whatsapp.mensagem_geral': {
    grupo: 'whatsapp',
    rotulo: 'Mensagem geral',
    padrao: 'Olá! Conheci seu trabalho pelo site e gostaria de conversar sobre uma sessão de fotos.',
    multilinha: true,
    dica: 'Já vem escrita para quem toca em “WhatsApp” no menu, na Home, no Contato e no rodapé.',
  },
  'whatsapp.mensagem_foto': {
    grupo: 'whatsapp',
    rotulo: 'Mensagem sobre uma foto',
    padrao:
      'Olá! Vi a foto "{titulo}" no seu site e tenho interesse em comprá-la. Pode me passar mais informações? {link}',
    multilinha: true,
    dica: 'Para quem toca no WhatsApp na página de uma foto. {titulo} vira o nome da foto e {link} o endereço dela — o {link} é obrigatório, para você saber de qual foto se trata.',
  },
} satisfies Record<string, DefinicaoTexto>

export type ChaveTexto = keyof typeof CATALOGO_TEXTOS

// Todos os textos, já resolvidos (banco ou padrão).
export type Textos = Record<ChaveTexto, string>

// Os retratos da artista: um por página (Home, A Artista e Contato), cada
// um podendo ser uma foto diferente. Ficam na mesma tabela, uma chave por
// página, mas não são texto editável no formulário — têm rota própria
// (upload de imagem, /api/textos/retrato). Página sem retrato mostra o "B".
export const RETRATOS = {
  home: { chave: 'retrato_home', onde: 'no bloco “Sobre a artista” da Home' },
  artista: { chave: 'retrato_artista', onde: 'na abertura da página A Artista' },
  contato: { chave: 'retrato_contato', onde: 'ao lado do texto da página Contato' },
} as const

export type LocalRetrato = keyof typeof RETRATOS

export type Retratos = Record<LocalRetrato, string | null>

export const LOCAIS_RETRATO = Object.keys(RETRATOS) as LocalRetrato[]

export function ehLocalRetrato(valor: unknown): valor is LocalRetrato {
  return typeof valor === 'string' && valor in RETRATOS
}

/** Lê das linhas do banco a URL de cada retrato (null quando não há). */
export function resolverRetratos(linhas: { chave: string; valor: string }[]): Retratos {
  const retratos = {} as Retratos
  for (const local of LOCAIS_RETRATO) {
    retratos[local] = linhas.find((linha) => linha.chave === RETRATOS[local].chave)?.valor || null
  }
  return retratos
}

export const GRUPOS_TEXTOS: { grupo: GrupoTextos; titulo: string; pagina?: string }[] = [
  { grupo: 'home', titulo: 'Página Home', pagina: '/' },
  { grupo: 'artista', titulo: 'Página A Artista', pagina: '/a-artista' },
  { grupo: 'contato', titulo: 'Página Contato', pagina: '/contato' },
  { grupo: 'whatsapp', titulo: 'Mensagens do WhatsApp' },
]

// Limites usados no admin (o banco tem o teto geral de 5000).
export const MAX_CARACTERES_CURTO = 200
export const MAX_CARACTERES_LONGO = 3000

export const CHAVES_TEXTOS = Object.keys(CATALOGO_TEXTOS) as ChaveTexto[]

export function ehChaveTexto(chave: string): chave is ChaveTexto {
  return chave in CATALOGO_TEXTOS
}

/** Junta as linhas do banco com os padrões do catálogo. */
export function resolverTextos(linhas: { chave: string; valor: string }[]): Textos {
  const textos = {} as Textos
  for (const chave of CHAVES_TEXTOS) textos[chave] = CATALOGO_TEXTOS[chave].padrao
  for (const { chave, valor } of linhas) {
    // Valor em branco (só espaços) não substitui o padrão: melhor o texto
    // antigo do que um buraco na página.
    if (ehChaveTexto(chave) && valor.trim()) textos[chave] = valor
  }
  return textos
}

/**
 * Quebra um texto multilinha em parágrafos: cada linha em branco separa um
 * parágrafo do outro. Quebras simples (um Enter só) viram espaço — quem
 * escreve num <textarea> costuma dar Enter no meio da frase sem querer.
 */
export function paragrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}
