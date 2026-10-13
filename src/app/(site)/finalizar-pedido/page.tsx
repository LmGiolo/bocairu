import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import FormularioFinalizarPedido from '@/components/checkout/FormularioFinalizarPedido'
import type { EnderecoEntrega } from '@/lib/pedidos/formulario'

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

  // Tabela de frete é dado público de vitrine (mesma policy que deixa
  // qualquer um ler tamanhos.preco_centavos) — dá pra ler com o client de
  // sessão, sem service role. Usada só pra estimativa em tela: o valor
  // cobrado de verdade é recalculado em POST /api/pedidos.
  // Pré-preenchimento: nome/telefone do Perfil e o endereço padrão salvo
  // em Minha Conta. É só conveniência — tudo continua editável no
  // formulário e é revalidado em POST /api/pedidos.
  const [{ data: fretes }, { data: perfil }, { data: enderecoPadrao }] = await Promise.all([
    supabase.from('fretes').select('regiao, porte, valor_centavos'),
    supabase.from('perfis').select('nome, telefone').eq('id', user.id).single(),
    supabase
      .from('enderecos')
      .select('cep, logradouro, numero, complemento, bairro, cidade, estado')
      .eq('cliente_id', user.id)
      .eq('padrao', true)
      .maybeSingle(),
  ])

  return (
    <FormularioFinalizarPedido
      emailInicial={user.email ?? ''}
      nomeInicial={perfil?.nome ?? ''}
      telefoneInicial={perfil?.telefone ?? ''}
      enderecoInicial={enderecoPadrao as EnderecoEntrega | null}
      tabelaFrete={fretes ?? []}
    />
  )
}
