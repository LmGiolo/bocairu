'use server'

import { revalidarSitePublico } from '@/lib/cache-site'
import { createClient } from '@/lib/supabase/server'
import { criarClientAdmin } from '@/lib/supabase/admin'

// Server Actions do admin.
//
// Atenção: TODA função exportada de um arquivo 'use server' vira um
// endereço que qualquer pessoa na internet consegue chamar (o Next cria a
// rota sozinho). Por isso cada uma refaz os dois portões das rotas de API —
// o layout de /admin não protege nada aqui. E por isso helpers sem portão
// (como revalidarSitePublico) moram em outro arquivo.

// Avisa o cache do site público que algo mudou. As telas do admin que
// gravam direto pelo client do navegador (textos, status e ordem das
// fotos) chamam esta função depois de salvar; as rotas de API não
// precisam, chamam revalidarSitePublico() por conta própria.
export async function atualizarSitePublico(): Promise<void> {
  // Portão 1 — identidade: getUser() confere o token no servidor de Auth.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Portão 2 — papel, lido com service role pelo id do token verificado
  // (mesma lógica de src/app/api/obras/route.ts, explicada lá).
  const { data: perfil } = await criarClientAdmin().from('perfis').select('papel').eq('id', user.id).single()
  if (perfil?.papel !== 'admin') return

  revalidarSitePublico()
}
