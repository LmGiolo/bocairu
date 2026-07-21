import { createBrowserClient } from '@supabase/ssr'

// Cria o "conector" que o navegador usa para falar com o Supabase.
// Ele lê a URL e a chave pública do arquivo .env.local —
// por isso nunca escrevemos as chaves direto aqui no código.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}