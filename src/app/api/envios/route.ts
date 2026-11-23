import type { NextRequest } from 'next/server'

import { conferirAdmin } from '@/lib/conferir-admin'
import { BUCKET_ENVIOS, LIMITE_ENVIO, ehFinalidadeEnvio, textoLimite } from '@/lib/envios/comum'
import { criarCaminhoEnvio } from '@/lib/envios/servidor'

// Passo 1 do envio direto (explicado em src/lib/envios/comum.ts): entrega
// ao navegador a permissão para gravar UM arquivo na pasta de passagem.
//
// Corpo (JSON): { finalidade: 'obra' | 'retrato', nome, tamanho }
// Resposta:     { caminho, token }
//
// Quem escolhe o caminho é o servidor, nunca o navegador: o token só vale
// para ele, então não dá para usar esta rota para sobrescrever outro
// arquivo do bucket.
export async function POST(request: NextRequest) {
  const portao = await conferirAdmin()
  if ('erro' in portao) return portao.erro
  const { admin } = portao

  const corpo = await request.json().catch(() => null)
  const finalidade = corpo?.finalidade
  const nome = corpo?.nome
  const tamanho = corpo?.tamanho

  if (!ehFinalidadeEnvio(finalidade)) {
    return Response.json({ erro: 'Finalidade do envio inválida.' }, { status: 400 })
  }
  if (typeof nome !== 'string' || typeof tamanho !== 'number' || tamanho <= 0) {
    return Response.json({ erro: 'Arquivo inválido.' }, { status: 400 })
  }
  // Primeira barreira contra arquivo grande demais (o tamanho aqui é o que
  // o navegador declarou; a rota que processa confere o arquivo real).
  if (tamanho > LIMITE_ENVIO[finalidade]) {
    return Response.json({ erro: textoLimite(finalidade) }, { status: 413 })
  }

  const caminho = criarCaminhoEnvio(nome)
  const { data, error } = await admin.storage.from(BUCKET_ENVIOS).createSignedUploadUrl(caminho)
  if (error || !data) {
    return Response.json({ erro: 'Não consegui preparar o envio: ' + (error?.message ?? 'sem resposta') }, { status: 500 })
  }

  return Response.json({ caminho, token: data.token })
}
