import { createClient } from '@/lib/supabase/client'
import { BUCKET_ENVIOS, LIMITE_ENVIO, textoLimite, type FinalidadeEnvio } from '@/lib/envios/comum'

// O lado navegador do envio direto (explicado em src/lib/envios/comum.ts):
// pede a URL assinada ao nosso servidor e manda o arquivo direto para o
// Storage. Devolve o CAMINHO, que o formulário repassa para a rota.
//
// Como as rotas, devolve "deu certo/deu errado com a mensagem" em vez de
// lançar exceção: a tela só precisa mostrar o texto.
export async function enviarDireto(
  arquivo: File,
  finalidade: FinalidadeEnvio
): Promise<{ ok: true; caminho: string } | { ok: false; erro: string }> {
  // Conferido aqui só para avisar antes de gastar internet; o servidor
  // confere de novo depois, com o arquivo de verdade na mão.
  if (arquivo.size > LIMITE_ENVIO[finalidade]) {
    return { ok: false, erro: textoLimite(finalidade) }
  }

  try {
    // Passo 1: a permissão para gravar (só sai para admin).
    const resposta = await fetch('/api/envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalidade, nome: arquivo.name, tamanho: arquivo.size }),
    })
    const corpo = await resposta.json().catch(() => null)
    if (!resposta.ok || !corpo?.caminho || !corpo?.token) {
      return { ok: false, erro: corpo?.erro ?? `O servidor recusou o envio (erro ${resposta.status}).` }
    }

    // Passo 2: o arquivo vai direto para o Storage. O token vale só para
    // este caminho, e só por 2 horas.
    const { error } = await createClient()
      .storage.from(BUCKET_ENVIOS)
      .uploadToSignedUrl(corpo.caminho, corpo.token, arquivo, { contentType: arquivo.type || undefined })
    if (error) {
      return { ok: false, erro: 'Falha ao enviar a imagem: ' + error.message }
    }

    return { ok: true, caminho: corpo.caminho }
  } catch {
    return { ok: false, erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' }
  }
}
