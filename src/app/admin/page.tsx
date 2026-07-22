import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormularioObra from '@/components/admin/FormularioObra'

export default async function Admin() {
  const supabase = await createClient()

  // 1) Quem está logado? (lê a sessão pelos cookies)
  const { data: { user } } = await supabase.auth.getUser()

  // Não está logado → manda pro login
  if (!user) {
    redirect('/entrar')
  }

  // 2) Essa pessoa é admin? Busca o papel dela na tabela perfis.
  const { data: perfil } = await supabase
    .from('perfis')
    .select('papel')
    .eq('id', user.id)
    .single()

  // Não é admin → manda embora (pro login)
  if (perfil?.papel !== 'admin') {
    redirect('/entrar')
  }

  // Passou pelos dois portões → é admin de verdade. Mostra o painel.
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Painel da Artista</h1>
      <p>Você está logada como admin. 🎉</p>
      <FormularioObra />
    </main>
  )
}