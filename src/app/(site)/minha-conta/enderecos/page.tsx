import { exigirUsuario } from '@/lib/conta/sessao'
import GerenciadorEnderecos, { type EnderecoSalvo } from '@/components/conta/GerenciadorEnderecos'

export default async function Enderecos() {
  const { supabase, user } = await exigirUsuario('/minha-conta/enderecos')

  // Padrão primeiro, depois do mais antigo pro mais novo — a ordem não
  // pula quando a cliente edita um endereço.
  const { data: enderecos, error } = await supabase
    .from('enderecos')
    .select('id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, padrao')
    .eq('cliente_id', user.id)
    .order('padrao', { ascending: false })
    .order('criado_em', { ascending: true })

  if (error) {
    throw new Error(`Não foi possível carregar os endereços: ${error.message}`)
  }

  return <GerenciadorEnderecos enderecos={(enderecos ?? []) as EnderecoSalvo[]} />
}
