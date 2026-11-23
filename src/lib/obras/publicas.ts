import 'server-only'

import { cache } from 'react'

import { criarClientPublico } from '@/lib/supabase/publico'

// A obra da Página da Obra, como o visitante a vê.
//
// `cache()` do React (o mesmo truque de lerConteudoSite): o título da aba
// (generateMetadata) e a página pedem a mesma obra na mesma visita, e o
// banco é consultado UMA vez só. Antes eram duas consultas iguais.
//
// Sem filtro de status: o RLS só devolve obra publicada para o client
// anônimo (ver docs/handoff.md §8). Obra que não existe ou não está
// publicada volta como null.
export const buscarObraPublica = cache(async (id: string) => {
  const { data } = await criarClientPublico().from('obras').select('*').eq('id', id).maybeSingle()
  return data
})
