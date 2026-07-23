'use client'

import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primario' | 'secundario' | 'terciario' | 'bordo'

const CLASSES_BASE =
  'inline-flex items-center justify-center gap-2 text-sm tracking-wide transition-colors duration-200'

const CLASSES_VARIANTE: Record<Variante, string> = {
  primario: 'rounded-sm bg-tinta px-9 py-4 text-areia hover:bg-tinta/90',
  secundario:
    'rounded-sm border border-tinta px-8 py-4 text-tinta hover:bg-tinta hover:text-areia',
  terciario: 'text-tinta underline underline-offset-4 hover:text-vinho-escuro',
  bordo: 'rounded-sm bg-vinho px-9 py-4 text-areia hover:bg-vinho-escuro',
}

const CLASSES_DESABILITADO =
  'cursor-not-allowed rounded-sm bg-creme px-9 py-4 text-pedra hover:bg-creme'

type Props = {
  variante?: Variante
  href?: string
  children: ReactNode
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

// Um único componente pra todos os botões do design system: renderiza link
// quando recebe `href`, botão nativo caso contrário. `disabled` sobrepõe
// qualquer variante com o visual "desabilitado" (obra indisponível etc.).
export default function Botao({
  variante = 'primario',
  href,
  children,
  className = '',
  disabled,
  type = 'button',
  ...resto
}: Props) {
  const classe = `${CLASSES_BASE} ${disabled ? CLASSES_DESABILITADO : CLASSES_VARIANTE[variante]} ${className}`

  if (href && !disabled) {
    return (
      <Link href={href} className={classe}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classe} disabled={disabled} type={type} {...resto}>
      {children}
    </button>
  )
}
