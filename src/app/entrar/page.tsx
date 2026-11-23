'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Botao from '@/components/ui/Botao'

const CLASSE_INPUT =
  'w-full border-b border-linho bg-transparent py-3 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta'
const CLASSE_LABEL = 'mb-2 block text-xs uppercase tracking-widest text-fumaca'

// Login da área administrativa — e só dela. Desde que o site virou portfólio
// (vendas em standby, ver docs/handoff.md), visitante não tem conta: o modo
// "Criar conta" saiu desta tela E o cadastro foi desligado no painel do
// Supabase (Authentication → Sign In / Providers → "Allow new users to sign
// up"). As duas coisas juntas: tirar só a tela deixaria o signUp() ainda
// chamável direto pela API, com a chave anon que é pública.
export default function Entrar() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro('')
    setCarregando(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error || !data.user) {
      setCarregando(false)
      setErro('E-mail ou senha incorretos.')
      return
    }

    // Conta que não é admin (sobra de antes do cadastro ser desligado) não
    // tem nada pra fazer logada: sai na hora, em vez de ficar com uma sessão
    // sem uso. O portão de verdade continua em admin/layout.tsx e no RLS.
    const { data: perfil } = await supabase.from('perfis').select('papel').eq('id', data.user.id).single()

    if (perfil?.papel !== 'admin') {
      await supabase.auth.signOut()
      setCarregando(false)
      setErro('Esta área é só para a administração do site.')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-[400px] px-6 py-24 md:px-0">
      <div className="mb-2 text-xs uppercase tracking-widest text-ouro">Área administrativa</div>
      <h1 className="mb-9 font-serif text-4xl text-tinta">Entrar.</h1>

      <form onSubmit={enviar} className="flex flex-col gap-7">
        <div>
          <label className={CLASSE_LABEL} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASSE_INPUT}
          />
        </div>

        <div>
          <label className={CLASSE_LABEL} htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={CLASSE_INPUT}
          />
        </div>

        {erro && (
          <div role="alert" className="flex items-start gap-2.5 text-sm text-[#B8492E]">
            <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8492E]" />
            {erro}
          </div>
        )}

        <Botao variante="bordo" type="submit" disabled={carregando} className="mt-2">
          {carregando ? 'Aguarde…' : 'Entrar'}
        </Botao>
      </form>
    </div>
  )
}
