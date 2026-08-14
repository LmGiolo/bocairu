import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'
import { validarFormularioObra } from '@/lib/obras/formulario'
import { STATUS_OBRA, type StatusObra } from '@/lib/obras/status'

// Edita uma obra existente: ficha técnica, tamanhos e status
// (rascunho/publicada/arquivada). Não mexe em imagem — trocar a foto de
// uma obra já publicada é fora do escopo combinado (ver docs/handoff.md,
// "Admin → listagem/edição de obras").
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Os mesmos dois portões de POST /api/obras — comentário completo lá.
  const supabase = await createClient()
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser()

  if (erroAuth || !user) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const admin = criarClientAdmin()

  const { data: perfil, error: erroPerfil } = await admin
    .from('perfis')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (erroPerfil || perfil?.papel !== 'admin') {
    return Response.json({ erro: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  // Daqui pra baixo: é admin confirmado.

  const formulario = await request.formData()

  // Mesma validação do cadastro — título, ficha técnica e tamanhos seguem
  // as mesmas regras dos dois lados. `arquivo` não é exigido aqui, e o
  // validador nem olha pra esse campo.
  const dados = validarFormularioObra(formulario)
  if (!dados.ok) {
    return Response.json({ erro: dados.erro }, { status: 400 })
  }

  const statusBruto = formulario.get('status')
  if (typeof statusBruto !== 'string' || !STATUS_OBRA.includes(statusBruto as StatusObra)) {
    return Response.json({ erro: 'Status inválido.' }, { status: 400 })
  }
  const status = statusBruto as StatusObra

  const { tamanhos, ...camposObra } = dados.valor

  // validarTamanhos() devolve as linhas sem o `id` do banco (não é campo
  // dela — só existe depois que o tamanho já foi salvo). Reconstruímos
  // aqui, na mesma ordem em que entraram, pra saber quais linhas já
  // existem (update) e quais são novas (insert).
  const tamanhosBrutos = JSON.parse(formulario.get('tamanhos') as string) as Array<{
    id?: unknown
  }>
  const tamanhosComId = tamanhos.map((tamanho, indice) => ({
    ...tamanho,
    id: typeof tamanhosBrutos[indice]?.id === 'string' ? (tamanhosBrutos[indice].id as string) : null,
  }))

  const { data: obraExistente, error: erroBusca } = await admin
    .from('obras')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (erroBusca) {
    return Response.json({ erro: 'Falha ao buscar a obra: ' + erroBusca.message }, { status: 500 })
  }
  if (!obraExistente) {
    return Response.json({ erro: 'Obra não encontrada.' }, { status: 404 })
  }

  const { data: tamanhosAtuais, error: erroAtuais } = await admin
    .from('tamanhos')
    .select('id')
    .eq('obra_id', id)

  if (erroAtuais) {
    return Response.json(
      { erro: 'Falha ao conferir os tamanhos atuais: ' + erroAtuais.message },
      { status: 500 }
    )
  }

  const idsAtuais = new Set(tamanhosAtuais.map((tamanho) => tamanho.id))
  const paraAtualizar = tamanhosComId.filter((tamanho) => tamanho.id !== null)
  const paraInserir = tamanhosComId.filter((tamanho) => tamanho.id === null)

  // Um id que veio do formulário mas não pertence aos tamanhos desta obra
  // é dado torto (obra errada, id de outra sessão) — recusa em vez de
  // editar a linha de outra obra por engano.
  const idPertenceAOutraObra = paraAtualizar.some((tamanho) => !idsAtuais.has(tamanho.id as string))
  if (idPertenceAOutraObra) {
    return Response.json({ erro: 'Um dos tamanhos enviados não pertence a esta obra.' }, { status: 400 })
  }

  const idsEnviados = new Set(paraAtualizar.map((tamanho) => tamanho.id))
  const idsParaApagar = [...idsAtuais].filter((idAtual) => !idsEnviados.has(idAtual))

  // ─────────────────────────────────────────────────────────────
  // Grava. Ao contrário do cadastro, isto não é uma única operação
  // atômica — são várias em sequência (mesmo limite honesto do POST, ver
  // docs/handoff.md: "isto não é uma transação"). Não tem pilha de
  // desfazer porque não há upload de arquivo envolvido: o pior cenário de
  // uma falha no meio do caminho é um tamanho que devia ter sido apagado
  // ou inserido ficar pendente — nunca um tamanho existente com preço
  // errado, porque cada update só toca a própria linha.
  // ─────────────────────────────────────────────────────────────
  const { data: obraAtualizada, error: erroObra } = await admin
    .from('obras')
    .update({ ...camposObra, status })
    .eq('id', id)
    .select()
    .single()

  if (erroObra) {
    return Response.json({ erro: 'Falha ao salvar a obra: ' + erroObra.message }, { status: 500 })
  }

  if (idsParaApagar.length > 0) {
    const { error: erroApagar } = await admin.from('tamanhos').delete().in('id', idsParaApagar)
    if (erroApagar) {
      return Response.json({ erro: 'Falha ao remover tamanhos: ' + erroApagar.message }, { status: 500 })
    }
  }

  for (const tamanho of paraAtualizar) {
    const { error: erroUpdate } = await admin
      .from('tamanhos')
      .update({
        rotulo: tamanho.rotulo,
        preco_centavos: tamanho.preco_centavos,
        disponivel: tamanho.disponivel,
        prazo_dias: tamanho.prazo_dias,
        porte: tamanho.porte,
        ordem: tamanho.ordem,
      })
      .eq('id', tamanho.id as string)

    if (erroUpdate) {
      return Response.json(
        { erro: `Falha ao atualizar o tamanho "${tamanho.rotulo}": ` + erroUpdate.message },
        { status: 500 }
      )
    }
  }

  let tamanhosInseridos: unknown[] = []
  if (paraInserir.length > 0) {
    const { data, error: erroInserir } = await admin
      .from('tamanhos')
      .insert(
        paraInserir.map((tamanho) => ({
          rotulo: tamanho.rotulo,
          preco_centavos: tamanho.preco_centavos,
          disponivel: tamanho.disponivel,
          prazo_dias: tamanho.prazo_dias,
          porte: tamanho.porte,
          ordem: tamanho.ordem,
          obra_id: id,
        }))
      )
      .select()

    if (erroInserir) {
      return Response.json(
        { erro: 'Falha ao adicionar tamanhos novos: ' + erroInserir.message },
        { status: 500 }
      )
    }
    tamanhosInseridos = data ?? []
  }

  return Response.json({ obra: obraAtualizada, tamanhosInseridos })
}
