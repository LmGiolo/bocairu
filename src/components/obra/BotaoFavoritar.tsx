'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

type Props = {
  obraId: string
  favoritoInicial: boolean
  /** Sem sessão, o coração vira um link pra /entrar que volta pra obra. */
  logado: boolean
  /**
   * 'pagina' — coração + texto, ao lado do título na Página da Obra.
   * 'cartao' — só o coração, num círculo escuro por cima da imagem (aba
   * Favoritos de Minha Conta).
   */
  variante?: 'pagina' | 'cartao'
}

function Coracao({ cheio }: { cheio: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={cheio ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.8 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.5 3.4 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
    </svg>
  )
}

// Favoritar escreve direto em `favoritos` pelo navegador — o RLS só deixa
// cada cliente mexer nas próprias linhas, e a chave primária
// (cliente_id, obra_id) impede favorito duplicado.
//
// A tela muda na hora (otimista) e volta atrás se o banco recusar.
export default function BotaoFavoritar({ obraId, favoritoInicial, logado, variante = 'pagina' }: Props) {
  const router = useRouter()
  const [favorito, setFavorito] = useState(favoritoInicial)
  const [ocupado, setOcupado] = useState(false)

  const classe =
    variante === 'cartao'
      ? 'flex h-8 w-8 items-center justify-center rounded-full bg-tinta/55 text-[#E9C98A] backdrop-blur-sm transition-colors duration-200 hover:bg-tinta/75'
      : 'inline-flex items-center gap-2 text-sm text-tinta transition-colors duration-200 hover:text-vinho'

  if (!logado) {
    return (
      <Link
        href={`/entrar?next=${encodeURIComponent(`/obras/${obraId}`)}`}
        className={classe}
        aria-label="Entre para favoritar esta obra"
      >
        <Coracao cheio={false} />
        {variante === 'pagina' && 'Favoritar'}
      </Link>
    )
  }

  async function alternar() {
    if (ocupado) return
    const novoValor = !favorito
    setFavorito(novoValor)
    setOcupado(true)

    const supabase = createClient()
    const { error } = novoValor
      ? await supabase.from('favoritos').insert({ obra_id: obraId })
      : await supabase.from('favoritos').delete().eq('obra_id', obraId)

    setOcupado(false)

    // 23505 = já existia (outra aba favoritou antes) — o estado final é o
    // que a pessoa queria, então não é erro.
    if (error && error.code !== '23505') {
      setFavorito(!novoValor)
      return
    }

    // Na aba Favoritos, desfavoritar tira o card da lista.
    if (variante === 'cartao') router.refresh()
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={favorito}
      aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`${classe} ${variante === 'pagina' && favorito ? 'text-vinho' : ''}`}
    >
      <Coracao cheio={favorito} />
      {variante === 'pagina' && (favorito ? 'Favoritada' : 'Favoritar')}
    </button>
  )
}
