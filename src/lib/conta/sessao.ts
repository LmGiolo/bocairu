import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

// Lê quem está logado UMA vez por requisição. O layout de /minha-conta e a
// página dentro dele precisam do usuário, e sem o `cache` do React cada um
// faria a sua própria ida ao servidor de Auth (getUser() valida o token lá,
// não só lê o cookie). O cache vale só pra requisição atual — nada vaza de
// um visitante pro outro.
export const lerUsuario = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
})

// Portão das páginas de /minha-conta. Fica em CADA página, não no layout:
// layout não roda de novo quando se navega entre as abas (ver "Layouts and
// auth checks" em node_modules/next/dist/docs/01-app/02-guides/authentication.md),
// então uma sessão expirada no meio do caminho passaria batido.
//
// Como no resto do projeto, isto é só UX — quem impede um cliente de ver o
// pedido de outro é o RLS (e o filtro por cliente_id em cada consulta).
export async function exigirUsuario(caminho: string) {
  const { supabase, user } = await lerUsuario()

  if (!user) {
    // Na raiz da conta, /entrar sem `?next=` já sabe pra onde mandar cada
    // um (admin → /admin, cliente → /minha-conta). Numa aba específica,
    // `next` garante a volta pra ela.
    redirect(caminho === '/minha-conta' ? '/entrar' : `/entrar?next=${encodeURIComponent(caminho)}`)
  }

  return { supabase, user }
}
