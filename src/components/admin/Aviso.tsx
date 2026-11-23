import type { ReactNode } from 'react'

export type TipoAviso = 'sucesso' | 'erro' | 'info'

// Mensagem de retorno do painel ("Salvo!", "Falha ao excluir…"). O §6 do
// handoff pede erro com ícone + texto — nunca só a cor, porque quem não
// distingue vermelho de verde precisa entender do mesmo jeito.
//
// `role`: "alert" faz o leitor de tela interromper e ler na hora (erro);
// "status" espera uma pausa (sucesso e andamento não são urgentes).
const ICONE: Record<TipoAviso, string> = {
  sucesso: '✔',
  erro: '⚠',
  info: '…',
}

const COR: Record<TipoAviso, string> = {
  sucesso: 'text-[#2F5233]',
  erro: 'text-vinho',
  info: 'text-fumaca',
}

export default function Aviso({
  tipo,
  children,
  className = '',
}: {
  tipo: TipoAviso
  children: ReactNode
  className?: string
}) {
  return (
    <p role={tipo === 'erro' ? 'alert' : 'status'} className={`flex items-start gap-2 text-sm ${COR[tipo]} ${className}`}>
      <span aria-hidden="true">{ICONE[tipo]}</span>
      <span>{children}</span>
    </p>
  )
}
