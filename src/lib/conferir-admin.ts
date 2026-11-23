import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'

// Os dois portões de rota de admin (ver CLAUDE.md, "O client de service
// role"), prontos para as rotas mais novas:
//
// 1. identidade — getUser() confere o token no servidor de Auth;
// 2. papel — lido com service role, pelo id do token verificado.
//
// A explicação longa de cada um está em src/app/api/obras/route.ts, que
// escreve os portões por extenso de propósito (é a rota-modelo).
//
// Devolve o client de service role (para a rota usar daqui pra frente) ou
// a resposta de erro pronta, que a rota só precisa repassar.
export async function conferirAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser()

  if (erroAuth || !user) {
    return { erro: Response.json({ erro: 'Não autenticado.' }, { status: 401 }) }
  }

  const admin = criarClientAdmin()
  const { data: perfil, error: erroPerfil } = await admin.from('perfis').select('papel').eq('id', user.id).single()

  if (erroPerfil || perfil?.papel !== 'admin') {
    return { erro: Response.json({ erro: 'Acesso restrito a administradores.' }, { status: 403 }) }
  }

  return { admin }
}
