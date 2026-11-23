// Parsing e validação do formulário de obra.
//
// Vive fora da rota de propósito: a rota cuida da ordem das coisas (checar
// quem é, processar imagem, gravar), e este arquivo cuida de transformar
// texto vindo do navegador em dados confiáveis. Nada aqui toca em rede,
// banco ou disco — é só entrada e saída.
//
// Desde que o site virou portfólio, a obra não tem mais tamanhos nem preço
// (ver "Vendas em standby" em docs/handoff.md). A conversão de preço em
// centavos e a lista de tamanhos estão guardadas na tag git `loja-v1`.

// Campos de texto opcionais da obra. Todos nullable no banco; aqui, ou string
// com conteúdo, ou null — nunca string vazia (ver validarTextoOpcional).
// `impressao` e `papel` continuam existindo no banco, mas saíram do
// formulário: eram dados de produto à venda.
export type FichaObra = {
  serie: string | null
  historia_titulo: string | null
  historia: string | null
  tecnica: string | null
  material: string | null
}

export type DadosObraValidados = FichaObra & {
  titulo: string
  descricao: string | null
  ano: number | null
}

// Em vez de lançar exceção, as funções devolvem "deu certo com o valor" ou
// "deu errado com a mensagem". Assim a rota decide o status HTTP e a
// mensagem chega pronta pra artista ler.
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string }

const MAX_CARACTERES_TITULO = 200
const MAX_CARACTERES_DESCRICAO = 5000
// Teto genérico dos campos curtos da ficha (série, técnica, material...).
const MAX_CARACTERES_FICHA = 200
// Historia é o único texto longo da ficha — cabe um parágrafo de contexto.
const MAX_CARACTERES_HISTORIA = 5000

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

/** Valida os campos de texto da obra. */
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

  // Ficha técnica: cinco campos de texto, todos opcionais. Historia é o único
  // longo; o resto compartilha o mesmo teto curto. Na primeira falha, para.
  const camposFicha = [
    ['serie', 'Série', MAX_CARACTERES_FICHA],
    ['historia_titulo', 'Título da história', MAX_CARACTERES_FICHA],
    ['historia', 'História', MAX_CARACTERES_HISTORIA],
    ['tecnica', 'Técnica', MAX_CARACTERES_FICHA],
    ['material', 'Material', MAX_CARACTERES_FICHA],
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

  return {
    ok: true,
    valor: { titulo, descricao: descricao.valor, ano, ...ficha },
  }
}
