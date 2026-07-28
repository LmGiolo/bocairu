// Validação da solicitação de encomenda — parsing e validação puros, sem
// import de servidor. Mesmo papel que src/lib/pedidos/formulario.ts cumpre
// pro pedido: usado pelo formulário (feedback imediato) e revalidado de
// novo na rota — a validação do cliente é conveniência, nunca garantia.

export type TipoProjeto = 'residencial' | 'corporativo' | 'hospitalidade' | 'nao_sei_ainda'

export type DadosEncomendaValidados = {
  nome: string
  email: string
  tipoProjeto: TipoProjeto
  mensagem: string
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string }

const MAX_CARACTERES_NOME = 200
const MAX_CARACTERES_EMAIL = 200
const MAX_CARACTERES_MENSAGEM = 2000

const TIPOS_PROJETO: TipoProjeto[] = ['residencial', 'corporativo', 'hospitalidade', 'nao_sei_ainda']

function textoObrigatorio(valor: unknown, rotulo: string, max: number): Resultado<string> {
  if (typeof valor !== 'string' || !valor.trim()) {
    return { ok: false, erro: `${rotulo} é obrigatório.` }
  }

  const limpo = valor.trim()

  if (limpo.length > max) {
    return { ok: false, erro: `${rotulo} passa de ${max} caracteres.` }
  }

  return { ok: true, valor: limpo }
}

export function validarFormularioEncomenda(bruto: unknown): Resultado<DadosEncomendaValidados> {
  if (typeof bruto !== 'object' || bruto === null) {
    return { ok: false, erro: 'Solicitação malformada.' }
  }

  const { nome, email, tipoProjeto, mensagem } = bruto as Record<string, unknown>

  const nomeValidado = textoObrigatorio(nome, 'Nome', MAX_CARACTERES_NOME)
  if (!nomeValidado.ok) return nomeValidado

  const emailValidado = textoObrigatorio(email, 'E-mail', MAX_CARACTERES_EMAIL)
  if (!emailValidado.ok) return emailValidado
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValidado.valor)) {
    return { ok: false, erro: 'E-mail inválido.' }
  }

  if (typeof tipoProjeto !== 'string' || !TIPOS_PROJETO.includes(tipoProjeto as TipoProjeto)) {
    return { ok: false, erro: 'Tipo de projeto inválido.' }
  }

  const mensagemValidada = textoObrigatorio(mensagem, 'Mensagem', MAX_CARACTERES_MENSAGEM)
  if (!mensagemValidada.ok) return mensagemValidada

  return {
    ok: true,
    valor: {
      nome: nomeValidado.valor,
      email: emailValidado.valor,
      tipoProjeto: tipoProjeto as TipoProjeto,
      mensagem: mensagemValidada.valor,
    },
  }
}
