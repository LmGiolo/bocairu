import { createClient } from '@/lib/supabase/server'

export default async function Galeria() {
  const supabase = await createClient()

  // Busca todas as obras. O RLS garante que só vêm as "publicada".
  const { data: obras, error } = await supabase
    .from('obras')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) {
    return <p style={{ color: 'crimson', padding: 40 }}>Erro: {error.message}</p>
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Galeria</h1>

      {obras.length === 0 ? (
        <p>Nenhuma obra publicada ainda.</p>
      ) : (
        <ul>
          {obras.map((obra) => (
            <li key={obra.id} style={{ marginBottom: 24 }}>
              {obra.imagem_web && (
                <img
                  src={obra.imagem_web}
                  alt={obra.titulo}
                  style={{ width: 300, height: 'auto', display: 'block' }}
                />
              )}
              <strong>{obra.titulo}</strong> — {obra.ano}
              <br />
              {obra.descricao}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}