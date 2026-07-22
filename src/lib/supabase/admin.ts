// Este import é uma trava: se algum componente 'use client' importar este
// arquivo (direto ou por tabela), o build QUEBRA. É a garantia de que a chave
// de service role nunca vai parar no bundle do navegador.
import 'server-only'

import { createClient as criarClientSupabase } from '@supabase/supabase-js'

// Client com a chave de SERVICE ROLE: ele ignora o RLS por completo.
//
// Por isso duas regras valem aqui:
//   1. A chave mora em SUPABASE_SERVICE_ROLE_KEY — sem o prefixo NEXT_PUBLIC_.
//      Só variáveis com esse prefixo são embutidas no JavaScript que vai pro
//      navegador; sem ele, a variável só existe no processo do servidor.
//   2. Nunca use este client sem antes ter checado, na mão, quem é a pessoa
//      que fez a requisição. Com service role não existe rede de proteção:
//      toda autorização passa a ser responsabilidade do nosso código.
export function criarClientAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chaveServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Falha alto e cedo: melhor um erro claro do que um client meia-boca
  // que só vai dar problema estranho lá na frente.
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definida.')
  }
  if (!chaveServiceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida no .env.local.')
  }

  return criarClientSupabase(url, chaveServiceRole, {
    auth: {
      // Este client não representa nenhum usuário e vive só durante a
      // requisição — não deve guardar nem renovar sessão nenhuma.
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
