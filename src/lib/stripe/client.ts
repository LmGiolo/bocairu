import 'server-only'
import Stripe from 'stripe'

// Client da Stripe, só de servidor — a chave secreta nunca pode chegar ao
// navegador. Mesmo cuidado do client de service role do Supabase (ver
// src/lib/supabase/admin.ts): o módulo importa `server-only` de propósito,
// então o build quebra se um componente 'use client' tentar importar isto.
//
// A checagem da chave fica dentro da função, não no nível do módulo — igual
// a `criarClientAdmin()`. Se estivesse no topo do arquivo, o `throw`
// rodaria assim que qualquer rota importasse este módulo, inclusive durante
// a coleta de dados de página do `next build` (que carrega o módulo de toda
// rota, mesmo as dinâmicas) — quebrando o build inteiro sem
// STRIPE_SECRET_KEY definida, em vez de só a chamada real falhar em runtime.
export function criarClientStripe() {
  const chave = process.env.STRIPE_SECRET_KEY

  if (!chave) {
    throw new Error(
      'STRIPE_SECRET_KEY não configurada. Defina no .env.local (chave de teste, ' +
        'painel da Stripe > Developers > API keys) ou nas variáveis de ambiente de produção.'
    )
  }

  return new Stripe(chave)
}
