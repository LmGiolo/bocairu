'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Botao from '@/components/ui/Botao'

const CLASSE_INPUT =
  'w-full border-b border-linho bg-transparent py-3 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta'
const CLASSE_LABEL = 'mb-2 block text-xs uppercase tracking-widest text-fumaca'

function ConteudoEntrar() {
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  // Cadastro com confirmação de e-mail ligada no projeto: signUp() dá certo
  // mas não devolve sessão. Em vez de tentar redirecionar sem sessão,
  // avisamos e paramos aqui.
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const proximaRota = searchParams.get('next') || '/'
  const supabase = createClient()

  // Sem `?next=` (não veio de um fluxo específico, como o checkout, que
  // sempre manda um destino) e a pessoa é admin → vai direto pro painel.
  // É o caminho mais comum de login hoje (a artista clicando no ícone de
  // conta do Cabeçalho, que não sabe nada sobre pra onde ela deveria ir).
  async function redirecionarAposEntrar(userId: string) {
    if (searchParams.get('next')) {
      router.push(proximaRota)
      router.refresh()
      return
    }

    const { data: perfil } = await supabase.from('perfis').select('papel').eq('id', userId).single()

    router.push(perfil?.papel === 'admin' ? '/admin' : '/')
    router.refresh()
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro('')
    setCarregando(true)

    if (modo === 'entrar') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      setCarregando(false)

      if (error || !data.user) {
        setErro('E-mail ou senha incorretos.')
        return
      }

      await redirecionarAposEntrar(data.user.id)
      return
    }

    // modo === 'cadastrar'
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      // O trigger handle_novo_usuario() lê raw_user_meta_data->>'nome' pra
      // criar a linha em `perfis` (papel 'cliente' por padrão).
      options: { data: { nome } },
    })
    setCarregando(false)

    if (error) {
      setErro(
        error.message.toLowerCase().includes('already registered')
          ? 'Já existe uma conta com este e-mail. Tente entrar.'
          : 'Não foi possível criar a conta. Confira os dados e tente de novo.'
      )
      return
    }

    if (data.session) {
      router.push(proximaRota)
      router.refresh()
      return
    }

    setAguardandoConfirmacao(true)
  }

  if (aguardandoConfirmacao) {
    return (
      <div className="mx-auto max-w-[400px] px-6 py-24 text-center md:px-0">
        <div className="mb-4 font-serif text-2xl italic text-tinta">Quase lá.</div>
        <p className="text-sm leading-relaxed text-fumaca">
          Enviamos um link de confirmação para <strong className="text-tinta">{email}</strong>.
          Confirme seu e-mail para poder entrar.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[400px] px-6 py-24 md:px-0">
      <div className="mb-2 text-xs uppercase tracking-widest text-ouro">
        {modo === 'entrar' ? 'Minha conta' : 'Criar conta'}
      </div>
      <h1 className="mb-9 font-serif text-4xl text-tinta">
        {modo === 'entrar' ? 'Entrar.' : 'Criar conta.'}
      </h1>

      <form onSubmit={enviar} className="flex flex-col gap-7">
        {modo === 'cadastrar' && (
          <div>
            <label className={CLASSE_LABEL} htmlFor="nome">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={CLASSE_INPUT}
            />
          </div>
        )}

        <div>
          <label className={CLASSE_LABEL} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
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
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={CLASSE_INPUT}
          />
        </div>

        {erro && (
          <div className="flex items-start gap-2.5 text-sm text-[#B8492E]">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8492E]" />
            {erro}
          </div>
        )}

        <Botao variante="bordo" type="submit" disabled={carregando} className="mt-2">
          {carregando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </Botao>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo((atual) => (atual === 'entrar' ? 'cadastrar' : 'entrar'))
          setErro('')
        }}
        className="mt-7 text-sm text-fumaca underline underline-offset-4 transition-colors duration-200 hover:text-vinho-escuro"
      >
        {modo === 'entrar' ? 'Não tem conta? Criar uma.' : 'Já tem conta? Entrar.'}
      </button>
    </div>
  )
}

export default function Entrar() {
  return (
    <Suspense fallback={null}>
      <ConteudoEntrar />
    </Suspense>
  )
}
