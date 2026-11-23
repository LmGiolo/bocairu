// ENVIO DIRETO DE ARQUIVO — a parte que o navegador e o servidor dividem.
//
// O problema: a foto original de uma obra passa fácil de 10 MB, e funções
// serverless (Vercel e afins) recusam requisição acima de ~4,5 MB. Mandar
// o arquivo para a nossa rota, como era antes, quebrava com foto grande.
//
// A solução, em três passos:
//
// 1. o navegador pede ao servidor uma "URL de envio assinada"
//    (POST /api/envios). O servidor confere se é admin e devolve um
//    caminho + um token que só servem para gravar AQUELE arquivo;
// 2. o navegador manda o arquivo direto para o Storage do Supabase com
//    esse token — sem passar pela nossa função, então sem limite dela;
// 3. o navegador chama a rota de sempre (/api/obras, /api/textos/retrato)
//    mandando só o CAMINHO. A rota baixa o arquivo do Storage, confere,
//    processa com o sharp e dá a ele o destino final.
//
// Os arquivos do passo 2 ficam numa pasta de passagem, `envios/`, dentro
// do bucket PRIVADO obras-alta: ninguém de fora enxerga, e o que sobrar
// ali (envio abandonado no meio) é lixo fácil de achar, não dado errado.

export const BUCKET_ENVIOS = 'obras-alta'
export const PASTA_ENVIOS = 'envios'

// Para que serve o arquivo — cada finalidade tem o seu teto de tamanho.
// 50 MB é também o limite de arquivo do plano grátis do Supabase.
export const LIMITE_ENVIO = {
  obra: 50 * 1024 * 1024,
  // Retrato é foto de apresentação, não precisa de arquivo de câmera em
  // resolução máxima.
  retrato: 20 * 1024 * 1024,
} as const

export type FinalidadeEnvio = keyof typeof LIMITE_ENVIO

export function ehFinalidadeEnvio(valor: unknown): valor is FinalidadeEnvio {
  return valor === 'obra' || valor === 'retrato'
}

export function textoLimite(finalidade: FinalidadeEnvio): string {
  return `Arquivo maior que ${LIMITE_ENVIO[finalidade] / 1024 / 1024} MB.`
}
