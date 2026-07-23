// Parsing e validação do formulário de obra.
//
// Vive fora da rota de propósito: a rota cuida da ordem das coisas (checar
// quem é, processar imagem, gravar), e este arquivo cuida de transformar
// texto vindo do navegador em dados confiáveis. Nada aqui toca em rede,
// banco ou disco — é só entrada e saída.

export type TamanhoValidado = {
  rotulo: string
  preco_centavos: number
  disponivel: boolean
  prazo_dias: string | null
  ordem: number
}

// Campos de texto opcionais da obra. Todos nullable no banco; aqui, ou string
// com conteúdo, ou null — nunca string vazia (ver validarTextoOpcional).
export type FichaObra = {
  serie: string | null
  historia_titulo: string | null
  historia: string | null
  tecnica: string | null
  material: string | null
  impressao: string | null
  papel: string | null
}

export type DadosObraValidados = FichaObra & {
  titulo: string
  descricao: string | null
  ano: number | null
  tamanhos: TamanhoValidado[]
}

// Em vez de lançar exceção, as funções devolvem "deu certo com o valor" ou
// "deu errado com a mensagem". Assim a rota decide o status HTTP e a
// mensagem chega pronta pra artista ler.
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string }

const MAX_TAMANHOS = 30
const MAX_CARACTERES_ROTULO = 60
const MAX_CARACTERES_TITULO = 200
const MAX_CARACTERES_DESCRICAO = 5000
const MAX_CARACTERES_PRAZO = 60
// Teto genérico dos campos curtos da ficha (série, técnica, material...).
const MAX_CARACTERES_FICHA = 200
// Historia é o único texto longo da ficha — cabe um parágrafo de contexto.
const MAX_CARACTERES_HISTORIA = 5000

// R$ 1.000.000,00 em centavos. Não é regra de negócio, é rede contra
// dedo escorregado — quem digita 25000000 provavelmente quis 250,00.
const PRECO_MAXIMO_CENTAVOS = 100_000_000

/**
 * Converte o preço digitado em centavos (inteiro).
 *
 * Aceita "250", "250,00", "1.234,56" (pt-BR) e "1234.56". Devolve null se
 * não der pra entender.
 */
export function precoParaCentavos(entrada: string): number | null {
  const limpo = entrada.trim().replace(/^r\$/i, '').replace(/\s/g, '')

  if (!limpo) return null
  // Só dígitos, ponto e vírgula. Isso já barra negativo, letra e sinal.
  if (!/^\d[\d.,]*$/.test(limpo)) return null

  let normalizado: string

  if (limpo.includes(',')) {
    // Formato brasileiro: a vírgula é o separador decimal e os pontos,
    // se houver, são separadores de milhar.
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  } else {
    const partes = limpo.split('.')
    // Sem vírgula, o ponto é ambíguo: "12.34" é decimal, mas "1.234" é
    // milhar. Um grupo de milhar sempre tem 3 dígitos, então até 2 dígitos
    // depois do último ponto significa decimal.
    normalizado = partes.length === 2 && partes[1].length <= 2 ? limpo : partes.join('')
  }

  const [inteiros, decimais = ''] = normalizado.split('.')

  if (decimais.length > 2) return null
  if (!/^\d+$/.test(inteiros)) return null

  // Aritmética só com inteiros, nunca com ponto flutuante. Em JavaScript
  // parseFloat('19.99') * 100 dá 1998.9999999999998 — truncar isso vira
  // R$ 19,98, e centavo perdido calado é bug de dinheiro. Somando
  // inteiros ("19" * 100 + "99") o resultado é exato sempre.
  const centavos = Number(inteiros) * 100 + Number(decimais.padEnd(2, '0'))

  if (!Number.isSafeInteger(centavos)) return null
  if (centavos > PRECO_MAXIMO_CENTAVOS) return null

  return centavos
}

/**
 * Caminho inverso de `precoParaCentavos`: centavos guardados no banco de
 * volta pra moeda formatada ("R$ 4.200,00"). Usado tanto na conferência do
 * formulário do admin quanto no preço mostrado na Página da Obra — mesmo
 * código dos dois lados, mesma regra de arredondamento.
 */
export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Lê um campo de texto opcional do FormData: apara os espaços, confere o
 * tamanho e devolve null quando vazio.
 *
 * Campo em branco vira null, não string vazia — no banco "não informado" é
 * null, e string vazia só criaria um segundo jeito de dizer a mesma coisa.
 */
function validarTextoOpcional(
  formulario: FormData,
  campo: string,
  rotulo: string,
  max: number
): Resultado<string | null> {
  const bruto = (formulario.get(campo) as string | null)?.trim() ?? ''

  if (bruto.length > max) {
    return { ok: false, erro: `${rotulo} passa de ${max} caracteres.` }
  }

  return { ok: true, valor: bruto || null }
}

/**
 * Valida a lista de tamanhos que chegou como JSON no FormData.
 *
 * `bruto` é `unknown` porque veio de JSON.parse: até conferir, pode ser
 * qualquer coisa.
 */
export function validarTamanhos(bruto: unknown): Resultado<TamanhoValidado[]> {
  if (!Array.isArray(bruto)) {
    return { ok: false, erro: 'Lista de tamanhos malformada.' }
  }

  if (bruto.length === 0) {
    return { ok: false, erro: 'Cadastre pelo menos um tamanho de impressão.' }
  }

  if (bruto.length > MAX_TAMANHOS) {
    return { ok: false, erro: `No máximo ${MAX_TAMANHOS} tamanhos por obra.` }
  }

  const tamanhos: TamanhoValidado[] = []
  const rotulosVistos = new Set<string>()

  for (const [indice, item] of bruto.entries()) {
    // Posição na tela, contando de 1 — é isso que a artista enxerga.
    const posicao = indice + 1

    if (typeof item !== 'object' || item === null) {
      return { ok: false, erro: `Tamanho ${posicao} está malformado.` }
    }

    const { rotulo, preco, disponivel, prazo_dias } = item as Record<string, unknown>

    if (typeof rotulo !== 'string' || !rotulo.trim()) {
      return { ok: false, erro: `Tamanho ${posicao}: falta o rótulo.` }
    }

    const rotuloLimpo = rotulo.trim()

    if (rotuloLimpo.length > MAX_CARACTERES_ROTULO) {
      return {
        ok: false,
        erro: `Tamanho ${posicao}: rótulo passa de ${MAX_CARACTERES_ROTULO} caracteres.`,
      }
    }

    // Dois "30x40 cm" na mesma obra são quase certamente engano, e
    // atrapalhariam na hora de escolher na loja.
    const chave = rotuloLimpo.toLowerCase()
    if (rotulosVistos.has(chave)) {
      return { ok: false, erro: `Tamanho "${rotuloLimpo}" aparece mais de uma vez.` }
    }
    rotulosVistos.add(chave)

    if (typeof preco !== 'string') {
      return { ok: false, erro: `Tamanho ${posicao}: falta o preço.` }
    }

    const centavos = precoParaCentavos(preco)

    if (centavos === null) {
      return { ok: false, erro: `Tamanho ${posicao}: preço "${preco}" não é um valor válido.` }
    }

    // disponivel vem como boolean do formulário. Qualquer outra coisa é
    // dado torto: em vez de "chutar" um valor, recusamos. Ausente (undefined)
    // é o único caso tolerado — cai no default true da coluna.
    if (disponivel !== undefined && typeof disponivel !== 'boolean') {
      return { ok: false, erro: `Tamanho ${posicao}: campo "disponível" malformado.` }
    }

    if (prazo_dias !== undefined && prazo_dias !== null && typeof prazo_dias !== 'string') {
      return { ok: false, erro: `Tamanho ${posicao}: prazo malformado.` }
    }

    const prazoLimpo = typeof prazo_dias === 'string' ? prazo_dias.trim() : ''

    if (prazoLimpo.length > MAX_CARACTERES_PRAZO) {
      return { ok: false, erro: `Tamanho ${posicao}: prazo passa de ${MAX_CARACTERES_PRAZO} caracteres.` }
    }

    tamanhos.push({
      rotulo: rotuloLimpo,
      preco_centavos: centavos,
      // Ausente = disponível: o default da coluna é true e é o caso comum.
      disponivel: disponivel ?? true,
      prazo_dias: prazoLimpo || null,
      // Guarda a ordem em que a artista montou a lista, senão o banco
      // devolve os tamanhos em ordem arbitrária depois.
      ordem: indice,
    })
  }

  return { ok: true, valor: tamanhos }
}

/** Valida os campos de texto da obra mais a lista de tamanhos. */
export function validarFormularioObra(formulario: FormData): Resultado<DadosObraValidados> {
  const titulo = (formulario.get('titulo') as string | null)?.trim() ?? ''

  if (!titulo) {
    return { ok: false, erro: 'O título é obrigatório.' }
  }
  if (titulo.length > MAX_CARACTERES_TITULO) {
    return { ok: false, erro: `Título passa de ${MAX_CARACTERES_TITULO} caracteres.` }
  }

  const descricao = validarTextoOpcional(formulario, 'descricao', 'Descrição', MAX_CARACTERES_DESCRICAO)
  if (!descricao.ok) return descricao

  // Ficha técnica: sete campos de texto, todos opcionais. Historia é o único
  // longo; o resto compartilha o mesmo teto curto. Na primeira falha, para.
  const camposFicha = [
    ['serie', 'Série', MAX_CARACTERES_FICHA],
    ['historia_titulo', 'Título da história', MAX_CARACTERES_FICHA],
    ['historia', 'História', MAX_CARACTERES_HISTORIA],
    ['tecnica', 'Técnica', MAX_CARACTERES_FICHA],
    ['material', 'Material', MAX_CARACTERES_FICHA],
    ['impressao', 'Impressão', MAX_CARACTERES_FICHA],
    ['papel', 'Papel', MAX_CARACTERES_FICHA],
  ] as const

  const ficha = {} as FichaObra
  for (const [campo, rotulo, max] of camposFicha) {
    const resultado = validarTextoOpcional(formulario, campo, rotulo, max)
    if (!resultado.ok) return resultado
    ficha[campo] = resultado.valor
  }

  const anoBruto = (formulario.get('ano') as string | null)?.trim() ?? ''
  let ano: number | null = null

  if (anoBruto) {
    if (!/^\d{4}$/.test(anoBruto)) {
      return { ok: false, erro: 'O ano deve ter 4 dígitos.' }
    }

    ano = Number(anoBruto)
    const anoLimite = new Date().getFullYear() + 1

    if (ano < 1800 || ano > anoLimite) {
      return { ok: false, erro: `O ano deve estar entre 1800 e ${anoLimite}.` }
    }
  }

  const tamanhosBrutos = formulario.get('tamanhos')

  if (typeof tamanhosBrutos !== 'string') {
    return { ok: false, erro: 'Lista de tamanhos não enviada.' }
  }

  let tamanhosJson: unknown
  try {
    tamanhosJson = JSON.parse(tamanhosBrutos)
  } catch {
    return { ok: false, erro: 'Lista de tamanhos malformada.' }
  }

  const tamanhos = validarTamanhos(tamanhosJson)
  if (!tamanhos.ok) return tamanhos

  return {
    ok: true,
    valor: { titulo, descricao: descricao.valor, ano, ...ficha, tamanhos: tamanhos.valor },
  }
}
