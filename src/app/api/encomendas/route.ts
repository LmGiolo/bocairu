import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { validarFormularioEncomenda } from '@/lib/encomendas/formulario'

// Sem portão de identidade aqui: o formulário de encomenda é público de
// propósito (visitante não-logado também pode pedir um orçamento). A
// policy de RLS de INSERT em `solicitacoes_encomenda` já é pública por
// desenho, e não existe preço nem nada pra recalcular no servidor antes de
// gravar — por isso esta rota usa o client de sessão (chave anon), não
// `criarClientAdmin()`. Diferente de /api/pedidos, que precisa de service
// role justamente porque ali há um valor sensível (preço) que a RLS
// pública não pode proteger sozinha.
export async function POST(request: NextRequest) {
  let corpo: unknown
  try {
    corpo = await request.json()
  } catch {
    return Response.json({ erro: 'Corpo da requisição malformado.' }, { status: 400 })
  }

  const dados = validarFormularioEncomenda(corpo)
  if (!dados.ok) {
    return Response.json({ erro: dados.erro }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.from('solicitacoes_encomenda').insert({
    nome: dados.valor.nome,
    email: dados.valor.email,
    tipo_projeto: dados.valor.tipoProjeto,
    mensagem: dados.valor.mensagem,
  })

  if (error) {
    return Response.json(
      { erro: 'Falha ao enviar a solicitação: ' + error.message },
      { status: 500 }
    )
  }

  return Response.json({ ok: true }, { status: 201 })
}
