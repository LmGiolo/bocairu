import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'
import { validarFormularioObra } from '@/lib/obras/formulario'
import { STATUS_OBRA, type StatusObra } from '@/lib/obras/status'

// Edita uma obra existente: ficha técnica e status
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

  // Mesma validação do cadastro — título e ficha técnica seguem as mesmas
  // regras dos dois lados. `arquivo` não é exigido aqui, e o
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

  // Um único UPDATE, numa linha só: é atômico por natureza. Se o id não
  // existir, `.single()` devolve erro e a resposta vira 404.
  const { data: obraAtualizada, error: erroObra } = await admin
    .from('obras')
    .update({ ...dados.valor, status })
    .eq('id', id)
    .select()
    .single()

  if (erroObra) {
    // PGRST116 = "nenhuma linha" — o id não bate com obra nenhuma.
    if (erroObra.code === 'PGRST116') {
      return Response.json({ erro: 'Obra não encontrada.' }, { status: 404 })
    }
    return Response.json({ erro: 'Falha ao salvar a obra: ' + erroObra.message }, { status: 500 })
  }

  return Response.json({ obra: obraAtualizada })
}
