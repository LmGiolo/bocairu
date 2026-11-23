import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { resolverRetratos, resolverTextos } from '@/lib/textos'
import Aviso from '@/components/admin/Aviso'
import CabecalhoPagina from '@/components/admin/CabecalhoPagina'
import EditorRetrato from '@/components/admin/EditorRetrato'
import EditorTextos from '@/components/admin/EditorTextos'

export const metadata: Metadata = { title: 'Textos do site' }

// Admin → Textos do site: os retratos e os textos da Home, A Artista,
// Contato e das mensagens do WhatsApp. O portão (sessão + papel admin) já
// roda em admin/layout.tsx. É a tela "Imagens do site" do protótipo
// (docs/prototipo/Admin.dc.html), que também agrupa as imagens por página.
export default async function TextosDoSite() {
  const supabase = await createClient()

  // Lê direto (e não por lerConteudoSite, que esconde o erro para o site
  // não quebrar): aqui o erro precisa aparecer, porque o mais provável é a
  // tabela ainda não existir.
  const { data: linhas, error } = await supabase.from('textos_site').select('chave, valor')

  const cabecalho = (
    <CabecalhoPagina
      sobretitulo="Conteúdo"
      titulo="Textos do site"
      descricao="Os retratos e os textos que contam quem você é. Cada página tem o próprio retrato e o próprio botão Salvar — o que você salvar aparece no site no próximo carregamento."
    />
  )

  if (error) {
    return (
      <>
        {cabecalho}
        <Aviso tipo="erro">
          Não consegui ler os textos ({error.message}). Se a tabela ainda não existe, rode o arquivo
          docs/sql/2026-11-23-textos-site.sql no SQL Editor do Supabase.
        </Aviso>
      </>
    )
  }

  const retratos = resolverRetratos(linhas ?? [])

  return (
    <>
      {cabecalho}
      <div className="max-w-3xl">
        <EditorTextos
          textosIniciais={resolverTextos(linhas ?? [])}
          // Um retrato por página, no topo do cartão de cada uma. O grupo
          // de textos e o local do retrato têm o mesmo nome.
          retratos={{
            home: <EditorRetrato local="home" retratoInicial={retratos.home} />,
            artista: <EditorRetrato local="artista" retratoInicial={retratos.artista} />,
            contato: <EditorRetrato local="contato" retratoInicial={retratos.contato} />,
          }}
        />
      </div>
    </>
  )
}
