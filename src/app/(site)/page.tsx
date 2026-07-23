import { createClient } from '@/lib/supabase/client'

export default async function Home() {
  // Cria o conector com o Supabase
  const supabase = createClient()

  // Pergunta ao banco: conte quantas linhas há na tabela "obras".
  // head: true → não traz os dados, só a contagem (mais leve).
  const { count, error } = await supabase
    .from('obras')
    .select('*', { count: 'exact', head: true })

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Bocairú — teste de conexão</h1>
      {error ? (
        <p style={{ color: 'crimson' }}>
          Erro ao conectar: {error.message}
        </p>
      ) : (
        <p style={{ color: 'green' }}>
          Conexão OK! Obras cadastradas: {count}
        </p>
      )}
    </main>
  )
}