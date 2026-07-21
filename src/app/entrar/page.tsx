'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Entrar() {
  // "estado": pedacinhos de memória da tela que mudam com o uso
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Chamada quando a pessoa clica em "Entrar"
  async function fazerLogin() {
    setErro('')
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    setCarregando(false)

    if (error) {
      setErro('E-mail ou senha incorretos.')
    } else {
      // Login deu certo → manda pro admin
      router.push('/admin')
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 360 }}>
      <h1>Entrar</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      {erro && <p style={{ color: 'crimson' }}>{erro}</p>}

      <button onClick={fazerLogin} disabled={carregando} style={{ padding: 8 }}>
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>
    </main>
  )
}