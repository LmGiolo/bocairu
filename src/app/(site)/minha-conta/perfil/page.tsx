import { exigirUsuario } from '@/lib/conta/sessao'
import Titulo from '@/components/conta/Titulo'
import FormularioPerfil from '@/components/conta/FormularioPerfil'
import FormularioSenha from '@/components/conta/FormularioSenha'

export default async function Perfil() {
  const { supabase, user } = await exigirUsuario('/minha-conta/perfil')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, telefone')
    .eq('id', user.id)
    .single()

  return (
    <>
      <Titulo overline="Conta">Perfil</Titulo>

      <div className="flex max-w-[480px] flex-col gap-6">
        <FormularioPerfil
          usuarioId={user.id}
          nomeInicial={perfil?.nome ?? ''}
          telefoneInicial={perfil?.telefone ?? ''}
          emailInicial={user.email ?? ''}
        />
        <FormularioSenha email={user.email ?? ''} />
      </div>
    </>
  )
}
