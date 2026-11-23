'use client'

import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'

import { STATUS_OBRA, ROTULOS_STATUS_OBRA, type StatusObra } from '@/lib/obras/status'
import Aviso, { type TipoAviso } from '@/components/admin/Aviso'
import {
  CLASSE_AREA_TEXTO,
  CLASSE_BOTAO_PRIMARIO,
  CLASSE_BOTAO_SECUNDARIO,
  CLASSE_CAMPO,
  CLASSE_ROTULO,
} from '@/components/admin/estilos'

// A ficha técnica da obra: cinco campos de texto, todos opcionais. Ficam
// juntos num objeto só pra não virar cinco useState quase idênticos.
type Ficha = {
  serie: string
  historia_titulo: string
  historia: string
  tecnica: string
  material: string
}

const FICHA_VAZIA: Ficha = {
  serie: '',
  historia_titulo: '',
  historia: '',
  tecnica: '',
  material: '',
}

// Dados de uma obra já existente, no formato que a tela usa. Passar `obra`
// liga o formulário no modo edição: PATCH em vez de POST, sem exigir
// arquivo, com o seletor de status visível.
export type ObraParaEdicao = {
  id: string
  titulo: string
  descricao: string
  ano: string
  ficha: Ficha
  status: StatusObra
  imagemWebUrl: string
}

// O <h2> do formulário dá nome à janela (aria-labelledby no <dialog> de
// PainelObras). Id fixo porque só existe uma janela aberta por vez.
export const ID_TITULO_JANELA = 'titulo-janela-obra'

// O formulário de obra, desenhado para morar dentro da janela modal de
// /admin/obras (docs/prototipo/Admin.dc.html, "MODAL: NOVA OBRA"): topo com
// título e ×, campos no meio, Cancelar/Salvar no pé. Topo e pé ficam
// grudados (sticky) — no celular o formulário é mais alto que a tela, e o
// botão Salvar precisa estar sempre à vista.
//
// Do protótipo saiu o que era de venda: tamanhos, preço, acabamento e
// certificado. As imagens "detalhe" e "ambientada" também ficaram de fora —
// a obra tem uma foto só.
export default function FormularioObra({
  obra,
  series,
  aoFechar,
  aoSalvar,
}: {
  obra?: ObraParaEdicao
  // Séries já usadas em outras obras, para o campo Série sugerir (e a
  // artista não criar "Retrato" e "Retratos" sem querer).
  series: string[]
  aoFechar: () => void
  aoSalvar: (mensagem: string) => void
}) {
  const modoEdicao = obra !== undefined

  const [titulo, setTitulo] = useState(obra?.titulo ?? '')
  const [descricao, setDescricao] = useState(obra?.descricao ?? '')
  const [ano, setAno] = useState(obra?.ano ?? '')
  const [ficha, setFicha] = useState<Ficha>(obra?.ficha ?? FICHA_VAZIA)
  const [status, setStatus] = useState<StatusObra>(obra?.status ?? 'publicada')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: TipoAviso; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  // useId: ids únicos para ligar cada <label> ao seu campo (htmlFor), sem
  // risco de colidir com outro id da página.
  const id = useId()

  // Prévia da imagem escolhida: o navegador cria um endereço temporário
  // (blob:) apontando pro arquivo na memória. Quando o arquivo muda ou a
  // janela fecha, o endereço antigo é liberado — senão a memória fica presa.
  const previa = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo])
  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa)
    }
  }, [previa])

  function alterarFicha(campo: keyof Ficha, valor: string) {
    setFicha((atual) => ({ ...atual, [campo]: valor }))
  }

  function escolherArquivo(novo: File | undefined) {
    if (!novo) return
    if (!novo.type.startsWith('image/')) {
      setMensagem({ tipo: 'erro', texto: 'Esse arquivo não é uma imagem.' })
      return
    }
    setArquivo(novo)
    setMensagem(null)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    // Sem isto, o navegador faria o envio "à moda antiga" e recarregaria a
    // página. Quem envia é o fetch abaixo.
    evento.preventDefault()

    if (!modoEdicao && !arquivo) {
      setMensagem({ tipo: 'erro', texto: 'Escolha a imagem da obra primeiro.' })
      return
    }

    setEnviando(true)
    setMensagem({
      tipo: 'info',
      texto: modoEdicao ? 'Salvando…' : 'Enviando… o servidor ainda vai preparar a imagem.',
    })

    // FormData é como se manda arquivo por HTTP. Não dá pra usar JSON aqui:
    // JSON só carrega texto, e a imagem é binária. No modo edição não há
    // arquivo nenhum — o campo simplesmente não é anexado.
    const dados = new FormData()
    if (arquivo) dados.append('arquivo', arquivo)
    dados.append('titulo', titulo)
    dados.append('descricao', descricao)
    dados.append('ano', ano)
    if (modoEdicao) dados.append('status', status)

    // A ficha inteira: a chave do estado bate o nome do campo que o servidor
    // espera, então um laço só resolve os cinco.
    for (const [campo, valor] of Object.entries(ficha)) {
      dados.append(campo, valor)
    }

    try {
      const resposta = await fetch(modoEdicao ? `/api/obras/${obra.id}` : '/api/obras', {
        method: modoEdicao ? 'PATCH' : 'POST',
        body: dados,
        // Nada de header 'Content-Type' aqui: o navegador precisa montar ele
        // sozinho pra incluir o "boundary" que separa os campos do FormData.
      })

      const corpo = await resposta.json().catch(() => null)

      if (!resposta.ok) {
        setMensagem({ tipo: 'erro', texto: corpo?.erro ?? `O servidor recusou (erro ${resposta.status}).` })
        return
      }

      // Deu certo: quem abriu a janela fecha ela e mostra o recado na lista.
      aoSalvar(
        modoEdicao
          ? `"${corpo.obra.titulo}" atualizada.`
          : `"${corpo.obra.titulo}" publicada — ela entrou no fim da ordem do site.`
      )
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Sem conexão com o servidor. Confira a internet e tente de novo.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex min-h-full flex-col">
      {/* ───── Topo ───── */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-linho bg-areia px-5 py-5 sm:px-9 sm:py-7">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-fumaca">
            {modoEdicao ? 'Edição de obra' : 'Cadastro de obra'}
          </div>
          <h2 id={ID_TITULO_JANELA} className="m-0 truncate font-serif text-[28px] font-normal leading-tight">
            {modoEdicao ? obra.titulo : 'Nova obra'}
          </h2>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-linho text-base transition-colors duration-200 hover:border-tinta"
        >
          ×
        </button>
      </div>

      {/* ───── Campos ───── */}
      <div className="flex flex-1 flex-col gap-7 px-5 py-8 sm:px-9">
        {/* Imagem */}
        <div>
          <div className={CLASSE_ROTULO} id={`${id}-imagem`}>
            Imagem da obra
          </div>
          <div className="flex flex-wrap items-start gap-5">
            {modoEdicao ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin sem next/image, ver docs/handoff.md §7 */}
                <img src={obra.imagemWebUrl} alt="" className="h-36 w-36 border border-tinta object-cover" />
                <p className="max-w-xs text-[13px] leading-relaxed text-fumaca">
                  Trocar a imagem ainda não é possível por aqui. Para usar outra foto, cadastre uma obra nova e
                  exclua esta.
                </p>
              </>
            ) : (
              <>
                {/* O <input type="file"> fica escondido (sr-only, mas ainda
                    focável pelo teclado) e o quadro inteiro é o <label> dele:
                    clicar no quadro abre o seletor de arquivos. Arrastar e
                    soltar também funciona (onDrop). */}
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    escolherArquivo(e.dataTransfer.files[0])
                  }}
                  className={`flex h-36 w-36 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden bg-white text-center text-xs text-fumaca transition-colors duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ouro hover:border-tinta ${
                    previa ? 'border border-tinta' : 'border border-dashed border-linho'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    aria-labelledby={`${id}-imagem`}
                    onChange={(e) => escolherArquivo(e.target.files?.[0])}
                    className="sr-only"
                  />
                  {previa ? (
                    // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), next/image não serve
                    <img src={previa} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <span aria-hidden="true" className="text-2xl leading-none text-tinta">
                        +
                      </span>
                      Escolher ou
                      <br />
                      arrastar a foto
                    </>
                  )}
                </label>
                <div className="max-w-xs text-[13px] leading-relaxed text-fumaca">
                  {arquivo ? (
                    <p className="mb-1 break-all text-tinta">
                      {arquivo.name}{' '}
                      <span className="text-fumaca">({(arquivo.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </p>
                  ) : null}
                  <p>
                    JPG, PNG, WebP, TIFF ou AVIF, até 50 MB. O site prepara sozinho a versão leve para a web; o
                    original fica guardado.
                  </p>
                  {arquivo && <p className="mt-1">Clique no quadro para trocar.</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Título / Série / Ano */}
        <div className="grid gap-7 sm:grid-cols-[1.4fr_1fr_0.7fr] sm:gap-6">
          <div>
            <label htmlFor={`${id}-titulo`} className={CLASSE_ROTULO}>
              Título
            </label>
            <input
              id={`${id}-titulo`}
              type="text"
              required
              maxLength={200}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Retrato ao meio-dia"
              className={CLASSE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor={`${id}-serie`} className={CLASSE_ROTULO}>
              Série
            </label>
            <input
              id={`${id}-serie`}
              type="text"
              list={`${id}-series`}
              maxLength={200}
              value={ficha.serie}
              onChange={(e) => alterarFicha('serie', e.target.value)}
              placeholder="Opcional"
              className={CLASSE_CAMPO}
            />
            {/* <datalist>: sugestões nativas do navegador enquanto digita. */}
            <datalist id={`${id}-series`}>
              {series.map((serie) => (
                <option key={serie} value={serie} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor={`${id}-ano`} className={CLASSE_ROTULO}>
              Ano
            </label>
            <input
              id={`${id}-ano`}
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              title="Quatro dígitos, ex.: 2026"
              maxLength={4}
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder={String(new Date().getFullYear())}
              className={CLASSE_CAMPO}
            />
          </div>
        </div>

        {/* Técnica / Material (+ Status na edição) */}
        <div className={`grid gap-7 sm:gap-6 ${modoEdicao ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <div>
            <label htmlFor={`${id}-tecnica`} className={CLASSE_ROTULO}>
              Técnica
            </label>
            <input
              id={`${id}-tecnica`}
              type="text"
              maxLength={200}
              value={ficha.tecnica}
              onChange={(e) => alterarFicha('tecnica', e.target.value)}
              placeholder="Ex.: Fotografia digital"
              className={CLASSE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor={`${id}-material`} className={CLASSE_ROTULO}>
              Material
            </label>
            <input
              id={`${id}-material`}
              type="text"
              maxLength={200}
              value={ficha.material}
              onChange={(e) => alterarFicha('material', e.target.value)}
              placeholder="Opcional"
              className={CLASSE_CAMPO}
            />
          </div>
          {modoEdicao && (
            <div>
              <label htmlFor={`${id}-status`} className={CLASSE_ROTULO}>
                Status
              </label>
              <select
                id={`${id}-status`}
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusObra)}
                className={`${CLASSE_CAMPO} cursor-pointer`}
              >
                {STATUS_OBRA.map((valor) => (
                  <option key={valor} value={valor}>
                    {ROTULOS_STATUS_OBRA[valor]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor={`${id}-descricao`} className={CLASSE_ROTULO}>
            Descrição
          </label>
          <p id={`${id}-descricao-dica`} className="-mt-0.5 mb-2 text-xs text-fumaca">
            Curta — aparece ao lado da foto, na página da obra.
          </p>
          <textarea
            id={`${id}-descricao`}
            aria-describedby={`${id}-descricao-dica`}
            maxLength={5000}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Uma ou duas frases sobre a foto…"
            className={CLASSE_AREA_TEXTO}
          />
        </div>

        {/* História: o texto longo que aparece abaixo da foto. */}
        <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
          <legend className="mb-1 font-serif text-[22px]">A história da foto</legend>
          <p className="-mt-3 text-xs text-fumaca">
            Opcional — vira uma seção própria abaixo da foto, na página da obra.
          </p>
          <div>
            <label htmlFor={`${id}-historia-titulo`} className={CLASSE_ROTULO}>
              Título da história
            </label>
            <input
              id={`${id}-historia-titulo`}
              type="text"
              maxLength={200}
              value={ficha.historia_titulo}
              onChange={(e) => alterarFicha('historia_titulo', e.target.value)}
              className={CLASSE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor={`${id}-historia`} className={CLASSE_ROTULO}>
              História
            </label>
            <textarea
              id={`${id}-historia`}
              maxLength={5000}
              value={ficha.historia}
              onChange={(e) => alterarFicha('historia', e.target.value)}
              rows={6}
              placeholder="O contexto, o lugar, o que aconteceu naquele dia…"
              className={CLASSE_AREA_TEXTO}
            />
          </div>
        </fieldset>
      </div>

      {/* ───── Pé ───── */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-linho bg-areia px-5 py-5 sm:px-9 sm:py-6">
        {mensagem && (
          <Aviso tipo={mensagem.tipo} className="mr-auto basis-full sm:basis-auto">
            {mensagem.texto}
          </Aviso>
        )}
        <button type="button" onClick={aoFechar} disabled={enviando} className={CLASSE_BOTAO_SECUNDARIO}>
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className={CLASSE_BOTAO_PRIMARIO}>
          {enviando ? 'Enviando…' : modoEdicao ? 'Salvar alterações' : 'Salvar obra'}
        </button>
      </div>
    </form>
  )
}
