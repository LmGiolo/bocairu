// Validação do pedido — parsing e validação, sem tocar em rede ou banco.
// Mesmo papel que src/lib/obras/formulario.ts cumpre pro cadastro de obra:
// usado pelo formulário (feedback imediato) e revalidado de novo na rota
// /api/pedidos (validação do cliente é conveniência, nunca garantia — preço
// e disponibilidade dos itens são conferidos à parte, contra o banco, não
// aqui).

export type EnderecoEntrega = {
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
}

export type ItemPedidoValidado = {
  tamanhoId: string
  quantidade: number
}

export type DadosPedidoValidados = {
  clienteNome: string
  clienteEmail: string
  clienteTelefone: string
  enderecoEntrega: EnderecoEntrega
  observacoes: string | null
  itens: ItemPedidoValidado[]
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string }

const MAX_ITENS = 30
const QUANTIDADE_MAXIMA_POR_ITEM = 20
const MAX_CARACTERES_NOME = 200
const MAX_CARACTERES_EMAIL = 200
const MAX_CARACTERES_TELEFONE = 30
const MAX_CARACTERES_OBSERVACOES = 2000
const MAX_CARACTERES_ENDERECO = 200

const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])

function textoObrigatorio(
  valor: unknown,
  rotulo: string,
  max: number
): Resultado<string> {
  if (typeof valor !== 'string' || !valor.trim()) {
    return { ok: false, erro: `${rotulo} é obrigatório.` }
  }

  const limpo = valor.trim()

  if (limpo.length > max) {
    return { ok: false, erro: `${rotulo} passa de ${max} caracteres.` }
  }

  return { ok: true, valor: limpo }
}

function validarEndereco(bruto: unknown): Resultado<EnderecoEntrega> {
  if (typeof bruto !== 'object' || bruto === null) {
    return { ok: false, erro: 'Endereço de entrega malformado.' }
  }

  const { cep, logradouro, numero, complemento, bairro, cidade, estado } = bruto as Record<
    string,
    unknown
  >

  const camposObrigatorios = [
    ['cep', cep, 'CEP'],
    ['logradouro', logradouro, 'Logradouro'],
    ['numero', numero, 'Número'],
    ['bairro', bairro, 'Bairro'],
    ['cidade', cidade, 'Cidade'],
  ] as const

  const valores: Record<string, string> = {}

  for (const [chave, valor, rotulo] of camposObrigatorios) {
    const resultado = textoObrigatorio(valor, rotulo, MAX_CARACTERES_ENDERECO)
    if (!resultado.ok) return resultado
    valores[chave] = resultado.valor
  }

  const cepLimpo = valores.cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) {
    return { ok: false, erro: 'CEP inválido — use 8 dígitos.' }
  }

  if (typeof estado !== 'string' || !UFS.has(estado.trim().toUpperCase())) {
    return { ok: false, erro: 'Estado (UF) inválido.' }
  }

  if (complemento !== undefined && complemento !== null && typeof complemento !== 'string') {
    return { ok: false, erro: 'Complemento malformado.' }
  }

  const complementoLimpo = typeof complemento === 'string' ? complemento.trim() : ''
  if (complementoLimpo.length > MAX_CARACTERES_ENDERECO) {
    return { ok: false, erro: `Complemento passa de ${MAX_CARACTERES_ENDERECO} caracteres.` }
  }

  return {
    ok: true,
    valor: {
      cep: cepLimpo,
      logradouro: valores.logradouro,
      numero: valores.numero,
      complemento: complementoLimpo || null,
      bairro: valores.bairro,
      cidade: valores.cidade,
      estado: estado.trim().toUpperCase(),
    },
  }
}

function validarItens(bruto: unknown): Resultado<ItemPedidoValidado[]> {
  if (!Array.isArray(bruto)) {
    return { ok: false, erro: 'Lista de itens malformada.' }
  }

  if (bruto.length === 0) {
    return { ok: false, erro: 'O carrinho está vazio.' }
  }

  if (bruto.length > MAX_ITENS) {
    return { ok: false, erro: `No máximo ${MAX_ITENS} itens por pedido.` }
  }

  const itens: ItemPedidoValidado[] = []

  for (const [indice, item] of bruto.entries()) {
    const posicao = indice + 1

    if (typeof item !== 'object' || item === null) {
      return { ok: false, erro: `Item ${posicao} está malformado.` }
    }

    const { tamanhoId, quantidade } = item as Record<string, unknown>

    if (typeof tamanhoId !== 'string' || !tamanhoId.trim()) {
      return { ok: false, erro: `Item ${posicao}: tamanho ausente.` }
    }

    if (
      typeof quantidade !== 'number' ||
      !Number.isInteger(quantidade) ||
      quantidade < 1 ||
      quantidade > QUANTIDADE_MAXIMA_POR_ITEM
    ) {
      return {
        ok: false,
        erro: `Item ${posicao}: quantidade deve ser um número inteiro entre 1 e ${QUANTIDADE_MAXIMA_POR_ITEM}.`,
      }
    }

    itens.push({ tamanhoId, quantidade })
  }

  return { ok: true, valor: itens }
}

export function validarFormularioPedido(bruto: unknown): Resultado<DadosPedidoValidados> {
  if (typeof bruto !== 'object' || bruto === null) {
    return { ok: false, erro: 'Pedido malformado.' }
  }

  const { clienteNome, clienteEmail, clienteTelefone, enderecoEntrega, observacoes, itens } =
    bruto as Record<string, unknown>

  const nome = textoObrigatorio(clienteNome, 'Nome', MAX_CARACTERES_NOME)
  if (!nome.ok) return nome

  const email = textoObrigatorio(clienteEmail, 'E-mail', MAX_CARACTERES_EMAIL)
  if (!email.ok) return email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.valor)) {
    return { ok: false, erro: 'E-mail inválido.' }
  }

  const telefone = textoObrigatorio(clienteTelefone, 'Telefone', MAX_CARACTERES_TELEFONE)
  if (!telefone.ok) return telefone

  const endereco = validarEndereco(enderecoEntrega)
  if (!endereco.ok) return endereco

  if (observacoes !== undefined && observacoes !== null && typeof observacoes !== 'string') {
    return { ok: false, erro: 'Observações malformadas.' }
  }
  const observacoesLimpas = typeof observacoes === 'string' ? observacoes.trim() : ''
  if (observacoesLimpas.length > MAX_CARACTERES_OBSERVACOES) {
    return { ok: false, erro: `Observações passam de ${MAX_CARACTERES_OBSERVACOES} caracteres.` }
  }

  const itensValidados = validarItens(itens)
  if (!itensValidados.ok) return itensValidados

  return {
    ok: true,
    valor: {
      clienteNome: nome.valor,
      clienteEmail: email.valor,
      clienteTelefone: telefone.valor,
      enderecoEntrega: endereco.valor,
      observacoes: observacoesLimpas || null,
      itens: itensValidados.valor,
    },
  }
}
