'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Botao from '@/components/ui/Botao'
import Aviso from '@/components/conta/Aviso'

const CLASSE_INPUT =
  'w-full border-b border-linho bg-transparent py-2.5 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta'
const CLASSE_LABEL = 'mb-1.5 block text-xs uppercase tracking-widest text-fumaca'

const MAX_CARACTERES_NOME = 200
const MAX_CARACTERES_TELEFONE = 30

type Props = {
  usuarioId: string
  nomeInicial: string
  telefoneInicial: string
  emailInicial: string
}

// Nome e telefone moram em `perfis` e são gravados direto pelo navegador.
// O banco só deixa o cliente mudar ESSAS duas colunas da própria linha
// (GRANT por coluna + RLS — ver docs/sql/2026-10-13-minha-conta.sql); sem
// isso, um update vindo daqui poderia trocar `papel` pra 'admin'.
//
// E-mail é outra história: ele é do Supabase Auth, não de `perfis`. Trocar
// manda um link de confirmação pro endereço novo, e só depois de clicar
// nele a troca vale.
export default function FormularioPerfil({ usuarioId, nomeInicial, telefoneInicial, emailInicial }: Props) {
  const router = useRouter()

  const [nome, setNome] = useState(nomeInicial)
  const [telefone, setTelefone] = useState(telefoneInicial)
  const [email, setEmail] = useState(emailInicial)
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setResultado(null)

    const nomeLimpo = nome.trim()
    const telefoneLimpo = telefone.trim()
    const emailLimpo = email.trim()

    if (!nomeLimpo) {
      setResultado({ tipo: 'erro', texto: 'Nome é obrigatório.' })
      return
    }
    if (nomeLimpo.length > MAX_CARACTERES_NOME) {
      setResultado({ tipo: 'erro', texto: `Nome passa de ${MAX_CARACTERES_NOME} caracteres.` })
      return
    }
    if (telefoneLimpo.length > MAX_CARACTERES_TELEFONE) {
      setResultado({ tipo: 'erro', texto: `Telefone passa de ${MAX_CARACTERES_TELEFONE} caracteres.` })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setResultado({ tipo: 'erro', texto: 'E-mail inválido.' })
      return
    }

    setSalvando(true)
    const supabase = createClient()

    const { error: erroPerfil } = await supabase
      .from('perfis')
      .update({ nome: nomeLimpo, telefone: telefoneLimpo || null })
      .eq('id', usuarioId)

    if (erroPerfil) {
      setSalvando(false)
      setResultado({ tipo: 'erro', texto: 'Não foi possível salvar. Tente de novo.' })
      return
    }

    const emailMudou = emailLimpo.toLowerCase() !== emailInicial.toLowerCase()

    // O nome também vive no user_metadata do Auth (é de lá que o trigger
    // de cadastro tirou o valor inicial) — mantém os dois iguais.
    const { error: erroAuth } = await supabase.auth.updateUser({
      data: { nome: nomeLimpo },
      ...(emailMudou ? { email: emailLimpo } : {}),
    })

    setSalvando(false)

    if (erroAuth) {
      setResultado({
        tipo: 'erro',
        texto: emailMudou
          ? 'Nome e telefone foram salvos, mas não foi possível trocar o e-mail. Confira o endereço e tente de novo.'
          : 'Não foi possível salvar. Tente de novo.',
      })
      return
    }

    setResultado({
      tipo: 'sucesso',
      texto: emailMudou
        ? `Alterações salvas. Enviamos um link de confirmação para ${emailLimpo} — o e-mail só muda depois que você clicar nele.`
        : 'Alterações salvas.',
    })
    // Atualiza o nome na barra lateral (vem do layout, no servidor).
    router.refresh()
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-6 border border-linho bg-white p-8">
      <div>
        <label className={CLASSE_LABEL} htmlFor="nome">
          Nome completo
        </label>
        <input
          id="nome"
          autoComplete="name"
          className={CLASSE_INPUT}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={CLASSE_LABEL} htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={CLASSE_INPUT}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={CLASSE_LABEL} htmlFor="telefone">
          Telefone
        </label>
        <input
          id="telefone"
          type="tel"
          autoComplete="tel"
          className={CLASSE_INPUT}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </div>

      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}

      <div>
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </Botao>
      </div>
    </form>
  )
}
