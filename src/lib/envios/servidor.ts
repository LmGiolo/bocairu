import 'server-only'

import type { criarClientAdmin } from '@/lib/supabase/admin'
import { BUCKET_ENVIOS, LIMITE_ENVIO, PASTA_ENVIOS, textoLimite, type FinalidadeEnvio } from '@/lib/envios/comum'

// O lado servidor do envio direto (explicado em src/lib/envios/comum.ts).

type ClientAdmin = ReturnType<typeof criarClientAdmin>

// Nome de arquivo vindo do usuário não serve como chave de storage: pode ter
// acento, espaço, barra. Reduz pra letras, números e hífen (sem extensão —
// quem decide a extensão é o formato que o sharp enxergar).
export function gerarNomeSeguro(nome: string) {
  return (
    nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // tira os acentos soltos pelo NFD
      .replace(/\.[^.]+$/, '') // tira a extensão
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'foto'
  )
}

// Caminho do arquivo na pasta de passagem: data + 8 caracteres aleatórios
// (dois envios no mesmo milissegundo não colidem) + o nome limpo.
// Ex.: envios/1795454701788-3f9a1c2e-por-do-sol
export function criarCaminhoEnvio(nomeOriginal: string): string {
  const aleatorio = crypto.randomUUID().replaceAll('-', '').slice(0, 8)
  return `${PASTA_ENVIOS}/${Date.now()}-${aleatorio}-${gerarNomeSeguro(nomeOriginal)}`
}

// O caminho chega do navegador, então NÃO confiamos nele: precisa ter
// exatamente o formato que criarCaminhoEnvio() gera. Sem isso, alguém
// poderia mandar o caminho de um original de obra já publicada (e a rota o
// moveria ou apagaria).
const FORMATO_CAMINHO = new RegExp(`^${PASTA_ENVIOS}/\\d+-[0-9a-f]{8}-[a-z0-9-]+$`)

export function ehCaminhoEnvio(valor: unknown): valor is string {
  return typeof valor === 'string' && FORMATO_CAMINHO.test(valor)
}

// A parte do caminho depois de `envios/` — vira a base do nome dos arquivos
// definitivos (a web e o original de uma obra compartilham essa base).
export function nomeBaseDoEnvio(caminho: string): string {
  return caminho.slice(PASTA_ENVIOS.length + 1)
}

// Baixa o arquivo enviado para a memória do servidor, conferindo o tamanho
// DE VERDADE (o que o navegador disse ao pedir a URL não vale como prova).
export async function baixarEnvio(
  admin: ClientAdmin,
  caminho: string,
  finalidade: FinalidadeEnvio
): Promise<{ ok: true; bytes: Buffer } | { ok: false; erro: string; status: number }> {
  const { data, error } = await admin.storage.from(BUCKET_ENVIOS).download(caminho)
  if (error || !data) {
    return { ok: false, erro: 'Não encontrei a imagem enviada. Tente enviar de novo.', status: 400 }
  }
  if (data.size > LIMITE_ENVIO[finalidade]) {
    return { ok: false, erro: textoLimite(finalidade), status: 413 }
  }
  return { ok: true, bytes: Buffer.from(await data.arrayBuffer()) }
}

// Apaga o arquivo da pasta de passagem. Falhar aqui não é grave (sobra lixo
// em envios/, nunca dado errado), então o erro é só registrado.
export async function apagarEnvio(admin: ClientAdmin, caminho: string): Promise<void> {
  const { error } = await admin.storage.from(BUCKET_ENVIOS).remove([caminho])
  if (error) console.error('[envios] não consegui apagar', caminho, error.message)
}
