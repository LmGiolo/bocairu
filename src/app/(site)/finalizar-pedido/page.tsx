import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import FormularioFinalizarPedido from '@/components/checkout/FormularioFinalizarPedido'

export default async function FinalizarPedido() {
  const supabase = await createClient()

  // Login só é exigido aqui, na confirmação final — montar o carrinho é
  // livre (ver docs/handoff.md). Sem sessão, manda pra /entrar e volta
  // direto pra cá depois.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar?next=/finalizar-pedido')
  }

  return (
    <FormularioFinalizarPedido
      emailInicial={user.email ?? ''}
      nomeInicial={typeof user.user_metadata?.nome === 'string' ? user.user_metadata.nome : ''}
    />
  )
}
