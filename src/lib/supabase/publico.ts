import { createClient } from '@supabase/supabase-js'

// Quarto client do Supabase: o do SITE PÚBLICO (Home, Galeria, Coleções,
// Página da Obra, textos do cabeçalho/rodapé, imagens de pré-visualização).
//
// A diferença para o de src/lib/supabase/server.ts é que este NÃO lê
// cookies. Parece detalhe, mas muda como o Next trata a página inteira:
// basta uma chamada a `cookies()` para a página virar "dinâmica", ou seja,
// ser montada de novo (com consultas ao banco) a cada visita. Sem cookies,
// a página pode ficar em cache e ser servida pronta (ver `revalidate` em
// src/app/(site)/layout.tsx e a invalidação em src/lib/cache-site.ts).
//
// Visitante não faz login, então não perde nada: este client sempre fala
// com o banco como ANÔNIMO. Quem decide o que ele enxerga continua sendo o
// RLS (só obra publicada, por exemplo). Consequência: a artista logada vê
// no site público exatamente o que o visitante vê — rascunho só no admin.
//
// Não use este client no admin nem em rota de API: lá a sessão importa.
export function criarClientPublico() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // Sem sessão para guardar nem renovar: é sempre o visitante anônimo.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
