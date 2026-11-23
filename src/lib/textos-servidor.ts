import 'server-only'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { resolverRetratos, resolverTextos, type Retratos, type Textos } from '@/lib/textos'

export type ConteudoSite = {
  textos: Textos
  // URL pública do retrato de cada página (Home, A Artista, Contato), ou
  // null — aí aquela página mostra o "B" tipográfico no lugar.
  retratos: Retratos
}

// Lê os textos do site (tabela `textos_site`) com fallback para os padrões
// de src/lib/textos.ts.
//
// `cache()` do React: numa mesma visita, o cabeçalho, o rodapé e a página
// pedem os textos — cada um chama lerConteudoSite() sozinho, sem precisar
// passar props de um para o outro — e o banco é consultado UMA vez só. O
// cache vale só para aquela requisição; a próxima visita lê de novo, então
// o que a artista salva no admin aparece no próximo carregamento.
export const lerConteudoSite = cache(async (): Promise<ConteudoSite> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('textos_site').select('chave, valor')

  if (error) {
    // Ex.: a tabela ainda não foi criada (docs/sql/2026-11-23-textos-site.sql
    // não rodou). O site segue com os textos padrão em vez de quebrar.
    // `warn` e não `error`: é uma situação prevista e o site está de pé —
    // no `npm run dev`, todo console.error do servidor abre a janela
    // vermelha de erro do Next, o que faria parecer que algo quebrou.
    console.warn('[textos_site] leitura falhou, usando os textos padrão:', error.message)
    return { textos: resolverTextos([]), retratos: resolverRetratos([]) }
  }

  const linhas = data ?? []
  return { textos: resolverTextos(linhas), retratos: resolverRetratos(linhas) }
})
