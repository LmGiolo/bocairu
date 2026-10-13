'use client'

import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import Botao from '@/components/ui/Botao'
import Aviso from '@/components/conta/Aviso'

const CLASSE_INPUT =
  'w-full border-b border-linho bg-transparent py-2.5 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta'

// Mínimo padrão do Supabase Auth. Se o projeto exigir mais (painel >
// Authentication > Policies), o próprio updateUser recusa e a mensagem de
// erro abaixo aparece.
const MIN_CARACTERES_SENHA = 6

// O `updateUser({ password })` do Supabase NÃO pede a senha atual — basta
// estar logado. Pedimos mesmo assim e conferimos com um signInWithPassword
// antes: sem isso, quem pegasse um computador com a sessão aberta trocaria a
// senha e trancaria a dona da conta pra fora.
export default function FormularioSenha({ email }: { email: string }) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  async function trocar(evento: React.FormEvent) {
    evento.preventDefault()
    setResultado(null)

    if (nova.length < MIN_CARACTERES_SENHA) {
      setResultado({ tipo: 'erro', texto: `A nova senha precisa de pelo menos ${MIN_CARACTERES_SENHA} caracteres.` })
      return
    }
    if (nova === atual) {
      setResultado({ tipo: 'erro', texto: 'A nova senha é igual à atual.' })
      return
    }

    setSalvando(true)
    const supabase = createClient()

    const { error: erroConferencia } = await supabase.auth.signInWithPassword({ email, password: atual })
    if (erroConferencia) {
      setSalvando(false)
      setResultado({ tipo: 'erro', texto: 'Senha atual incorreta.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: nova })
    setSalvando(false)

    if (error) {
      setResultado({ tipo: 'erro', texto: 'Não foi possível atualizar a senha. Tente uma senha mais forte.' })
      return
    }

    setAtual('')
    setNova('')
    setResultado({ tipo: 'sucesso', texto: 'Senha atualizada.' })
  }

  return (
    <form onSubmit={trocar} className="border border-linho bg-white p-8">
      <div className="mb-5 text-sm font-medium text-tinta">Alterar senha</div>
      <div className="mb-6 flex flex-col gap-5">
        <div>
          <label className="sr-only" htmlFor="senha-atual">
            Senha atual
          </label>
          <input
            id="senha-atual"
            type="password"
            autoComplete="current-password"
            placeholder="Senha atual"
            className={CLASSE_INPUT}
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="sr-only" htmlFor="senha-nova">
            Nova senha
          </label>
          <input
            id="senha-nova"
            type="password"
            autoComplete="new-password"
            placeholder="Nova senha"
            className={CLASSE_INPUT}
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            required
          />
        </div>
      </div>

      {resultado && (
        <div className="mb-5">
          <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>
        </div>
      )}

      <Botao type="submit" variante="secundario" disabled={salvando}>
        {salvando ? 'Atualizando…' : 'Atualizar senha'}
      </Botao>
    </form>
  )
}
