'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import Aviso from '@/components/admin/Aviso'
import CabecalhoPagina from '@/components/admin/CabecalhoPagina'
import FormularioObra, { ID_TITULO_JANELA, type ObraParaEdicao } from '@/components/admin/FormularioObra'
import ListaObras, { type ObraAdmin } from '@/components/admin/ListaObras'
import { CLASSE_BOTAO_PRIMARIO } from '@/components/admin/estilos'

// O que está aberto na janela: nada, o cadastro, ou a edição de uma obra.
type Janela = null | { modo: 'nova' } | { modo: 'edicao'; obra: ObraParaEdicao }

// Converte a linha do banco (null em campo vazio) para o formato do
// formulário (string vazia em campo vazio — <input> não aceita null).
function paraEdicao(obra: ObraAdmin): ObraParaEdicao {
  return {
    id: obra.id,
    titulo: obra.titulo,
    descricao: obra.descricao ?? '',
    ano: obra.ano != null ? String(obra.ano) : '',
    ficha: {
      serie: obra.serie ?? '',
      historia_titulo: obra.historia_titulo ?? '',
      historia: obra.historia ?? '',
      tecnica: obra.tecnica ?? '',
      material: obra.material ?? '',
    },
    status: obra.status,
    imagemWebUrl: obra.imagem_web,
  }
}

// A tela /admin/obras: título, botão "+ Nova obra", a tabela e a janela
// (modal) de cadastro/edição, como em docs/prototipo/Admin.dc.html. Antes,
// cadastro e edição eram páginas separadas (/admin e
// /admin/obras/[id]/editar).
//
// A janela é um <dialog> nativo aberto com showModal(): o navegador cuida
// de prender o foco dentro dela, fechar com Esc e deixar o resto da página
// inerte — o que o §6 do handoff pede para qualquer sobreposição.
export default function PainelObras({ obras }: { obras: ObraAdmin[] }) {
  const router = useRouter()
  const dialogo = useRef<HTMLDialogElement>(null)
  const [janela, setJanela] = useState<Janela>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Abre o <dialog> DEPOIS que o formulário já foi desenhado dentro dele.
  // Se showModal() rodasse no clique, junto com o setJanela, o navegador
  // poria o foco num conteúdo que o React ainda ia trocar — e o foco se
  // perderia.
  useEffect(() => {
    if (janela && dialogo.current && !dialogo.current.open) {
      dialogo.current.showModal()
    }
  }, [janela])

  function abrir(nova: Janela) {
    setAviso(null)
    setJanela(nova)
  }

  function fechar() {
    dialogo.current?.close()
  }

  function salvou(mensagem: string) {
    fechar()
    setAviso(mensagem)
    // Pede ao servidor a lista de novo: a obra nova (ou editada) aparece na
    // tabela já com os dados que o banco gravou.
    router.refresh()
  }

  // Séries já usadas, sem repetição e em ordem alfabética — sugestões do
  // campo Série no formulário.
  const series = [...new Set(obras.map((obra) => obra.serie).filter((serie): serie is string => !!serie))].sort(
    (a, b) => a.localeCompare(b, 'pt-BR')
  )

  return (
    <>
      <CabecalhoPagina
        sobretitulo="Catálogo"
        titulo="Obras"
        acao={
          <button type="button" onClick={() => abrir({ modo: 'nova' })} className={CLASSE_BOTAO_PRIMARIO}>
            + Nova obra
          </button>
        }
      />

      {aviso && (
        <Aviso tipo="sucesso" className="mb-6">
          {aviso}
        </Aviso>
      )}

      <ListaObras obras={obras} aoEditar={(obra) => abrir({ modo: 'edicao', obra: paraEdicao(obra) })} />

      <dialog
        ref={dialogo}
        aria-labelledby={ID_TITULO_JANELA}
        // `close` dispara em qualquer jeito de fechar (Esc, ×, Cancelar,
        // salvar). Só aqui o formulário sai da tela — e, com ele, o que
        // estava digitado: abrir de novo começa limpo.
        onClose={() => setJanela(null)}
        // Clicar fora NÃO fecha, de propósito (no protótipo fechava): o
        // formulário é longo, e um clique errado no fundo apagaria tudo.
        // No celular a janela ocupa a tela inteira; a partir de 640px vira
        // a caixa de até 880px do protótipo, com o fundo escurecido.
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-areia p-0 text-tinta backdrop:bg-tinta/55 sm:m-auto sm:h-auto sm:max-h-[calc(100dvh-6rem)] sm:w-[calc(100%-3rem)] sm:max-w-[880px] sm:rounded-sm sm:border sm:border-linho sm:shadow-[0_24px_64px_rgba(27,24,20,0.28)]"
      >
        {janela && (
          <FormularioObra
            // `key`: trocar de obra (ou de cadastro pra edição) monta um
            // formulário novo, em vez de reaproveitar o estado do anterior.
            key={janela.modo === 'edicao' ? janela.obra.id : 'nova'}
            obra={janela.modo === 'edicao' ? janela.obra : undefined}
            series={series}
            aoFechar={fechar}
            aoSalvar={salvou}
          />
        )}
      </dialog>
    </>
  )
}
