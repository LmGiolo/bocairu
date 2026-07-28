import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'
import { validarFormularioPedido } from '@/lib/pedidos/formulario'

export async function POST(request: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // PORTÃO — QUEM É VOCÊ?
  //
  // Só existe um portão aqui (não dois, como em /api/obras): não é
  // preciso ser admin pra criar um pedido, só estar autenticado. O
  // cliente_id do pedido vem sempre de user.id (do token verificado),
  // nunca do corpo da requisição — ninguém cria pedido em nome de outra
  // pessoa.
  // ─────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser()

  if (erroAuth || !user) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  // ─────────────────────────────────────────────────────────────
  // 1) VALIDA A FORMA DO PEDIDO ANTES DE TOCAR NO BANCO
  // ─────────────────────────────────────────────────────────────
  let corpo: unknown
  try {
    corpo = await request.json()
  } catch {
    return Response.json({ erro: 'Corpo da requisição malformado.' }, { status: 400 })
  }

  const dados = validarFormularioPedido(corpo)
  if (!dados.ok) {
    return Response.json({ erro: dados.erro }, { status: 400 })
  }

  // ─────────────────────────────────────────────────────────────
  // 2) RECALCULA PREÇO E DISPONIBILIDADE NO SERVIDOR
  //
  // O carrinho do navegador só guarda um preço em cache pra exibição. Aqui
  // é a única fonte de verdade: lê `tamanhos` de novo, com o client de
  // sessão — a mesma policy pública que /galeria e /obras/[id] já usam
  // pra mostrar preço. `obras!inner(...)` faz o item sumir da resposta se
  // a obra não estiver mais publicada (RLS), então "não achei" já cobre
  // obra despublicada.
  // ─────────────────────────────────────────────────────────────
  const idsTamanhos = dados.valor.itens.map((item) => item.tamanhoId)

  const { data: tamanhosEncontrados, error: erroTamanhos } = await supabase
    .from('tamanhos')
    .select('id, rotulo, preco_centavos, disponivel, obra_id, obras!inner(id, titulo)')
    .in('id', idsTamanhos)

  if (erroTamanhos) {
    return Response.json(
      { erro: 'Falha ao conferir os itens do carrinho: ' + erroTamanhos.message },
      { status: 500 }
    )
  }

  const porId = new Map(tamanhosEncontrados.map((tamanho) => [tamanho.id, tamanho]))

  // O client sem tipos gerados do banco (`Database`) infere todo embed como
  // array, mas `obras!inner(...)` embutido a partir de `tamanhos` é
  // muitos-pra-um — na prática o Postgrest devolve um objeto só. Normaliza
  // os dois formatos possíveis em vez de confiar num dos dois.
  function obraDoTamanho(obras: unknown): { id: string; titulo: string } | undefined {
    if (Array.isArray(obras)) return obras[0]
    return obras as { id: string; titulo: string } | undefined
  }

  const itensParaGravar: Array<{
    obra_id: string
    tamanho_id: string
    obra_titulo: string
    tamanho_rotulo: string
    preco_centavos: number
    quantidade: number
  }> = []

  for (const item of dados.valor.itens) {
    const tamanho = porId.get(item.tamanhoId)
    const obra = tamanho ? obraDoTamanho(tamanho.obras) : undefined

    if (!tamanho || !obra) {
      return Response.json(
        { erro: 'Uma das obras do carrinho não está mais disponível. Remova-a e tente de novo.' },
        { status: 400 }
      )
    }

    if (!tamanho.disponivel) {
      return Response.json(
        {
          erro: `"${obra.titulo}" (${tamanho.rotulo}) ficou indisponível nesse tamanho. Remova-a do carrinho e tente de novo.`,
        },
        { status: 400 }
      )
    }

    itensParaGravar.push({
      obra_id: tamanho.obra_id,
      tamanho_id: tamanho.id,
      obra_titulo: obra.titulo,
      tamanho_rotulo: tamanho.rotulo,
      preco_centavos: tamanho.preco_centavos,
      quantidade: item.quantidade,
    })
  }

  const totalCentavos = itensParaGravar.reduce(
    (soma, item) => soma + item.preco_centavos * item.quantidade,
    0
  )

  // ─────────────────────────────────────────────────────────────
  // 3) GRAVA — pilha de desfazer, mesmo padrão de /api/obras
  //
  // Não existe policy de INSERT em pedidos/pedido_itens de propósito (ver
  // docs/handoff.md): a criação passa só por aqui, depois que preço e
  // disponibilidade já foram conferidos contra o banco. `criarClientAdmin`
  // ignora RLS — é este código, e só ele, que decide o que é uma escrita
  // válida.
  // ─────────────────────────────────────────────────────────────
  const admin = criarClientAdmin()
  const desfazer: Array<() => PromiseLike<unknown>> = []

  async function reverterTudo() {
    for (const acao of desfazer.reverse()) {
      try {
        await acao()
      } catch {
        // Limpeza que falha não tem o que fazer além de seguir — entregar
        // o erro importa mais que a faxina.
      }
    }
  }

  const { data: pedido, error: erroPedido } = await admin
    .from('pedidos')
    .insert({
      cliente_id: user.id,
      cliente_nome: dados.valor.clienteNome,
      cliente_email: dados.valor.clienteEmail,
      cliente_telefone: dados.valor.clienteTelefone,
      endereco_entrega: dados.valor.enderecoEntrega,
      status: 'aguardando_pagamento',
      total_centavos: totalCentavos,
      observacoes: dados.valor.observacoes,
    })
    .select()
    .single()

  if (erroPedido) {
    return Response.json({ erro: 'Falha ao criar o pedido: ' + erroPedido.message }, { status: 500 })
  }
  desfazer.push(() => admin.from('pedidos').delete().eq('id', pedido.id))

  // Um único insert com a lista inteira — comando SQL atômico, sem estado
  // de "metade dos itens salvos" pra limpar depois.
  const { error: erroItens } = await admin
    .from('pedido_itens')
    .insert(itensParaGravar.map((item) => ({ ...item, pedido_id: pedido.id })))

  if (erroItens) {
    await reverterTudo()
    return Response.json(
      { erro: 'Falha ao salvar os itens do pedido: ' + erroItens.message },
      { status: 500 }
    )
  }

  return Response.json({ pedido }, { status: 201 })
}
