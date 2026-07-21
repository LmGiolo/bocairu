'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UploadTeste() {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const supabase = createClient()

  async function enviar() {
    if (!arquivo) {
      setStatus('Escolha um arquivo primeiro.')
      return
    }

    setStatus('Enviando...')

    // 1) Sobe o arquivo pro bucket
    const nomeArquivo = `${Date.now()}-${arquivo.name}`
    const { error: erroUpload } = await supabase.storage
      .from('obras-web')
      .upload(nomeArquivo, arquivo)

    if (erroUpload) {
      setStatus('Erro no upload: ' + erroUpload.message)
      return
    }

    // 2) Descobre a URL pública da imagem que acabou de subir
    const { data: dadosUrl } = supabase.storage
      .from('obras-web')
      .getPublicUrl(nomeArquivo)

    const urlPublica = dadosUrl.publicUrl

    // 3) Cria uma obra nova já com essa imagem
    const { error: erroObra } = await supabase
      .from('obras')
      .insert({
        titulo: 'Obra sem título',
        status: 'publicada',
        imagem_web: urlPublica,
      })

    if (erroObra) {
      setStatus('Imagem subiu, mas erro ao criar obra: ' + erroObra.message)
      return
    }

    setStatus('Pronto! Obra criada com a imagem. Veja na galeria.')
  }

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #ccc' }}>
      <h2>Teste de upload</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
      />

      <button onClick={enviar} style={{ marginLeft: 8, padding: 6 }}>
        Enviar
      </button>

      {status && <p>{status}</p>}
    </div>
  )
}