'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import { createClient } from '@/lib/supabase/client'
import {
  CATALOGO_TEXTOS,
  CHAVES_TEXTOS,
  GRUPOS_TEXTOS,
  MAX_CARACTERES_CURTO,
  MAX_CARACTERES_LONGO,
  type ChaveTexto,
  type GrupoTextos,
  type Textos,
} from '@/lib/textos'
import Aviso, { type TipoAviso } from '@/components/admin/Aviso'
import {
  CLASSE_AREA_TEXTO,
  CLASSE_BOTAO_PRIMARIO,
  CLASSE_BOTAO_TEXTO,
  CLASSE_CAMPO,
  CLASSE_CARTAO,
  CLASSE_ROTULO,
} from '@/components/admin/estilos'

// Recado que aparece no topo de um grupo, quando há algo a dizer.
const RECADO_DO_GRUPO: Partial<Record<GrupoTextos, string>> = {
  artista:
    'Os textos de exemplo desta página foram escritos quando o site vendia impressões. Vale reescrever com a sua voz — a Trajetória, por exemplo, diz “não há ensaio nem direção”, e hoje o site oferece sessões de foto.',
  whatsapp:
    'É o texto que já vem digitado quando a pessoa abre a conversa com você. Ela pode mudar antes de enviar.',
}

function chavesDoGrupo(grupo: GrupoTextos) {
  return CHAVES_TEXTOS.filter((chave) => CATALOGO_TEXTOS[chave].grupo === grupo)
}

// Confere um texto antes de salvar. Devolve a mensagem de erro, ou null.
function validar(chave: ChaveTexto, valor: string): string | null {
  const definicao = CATALOGO_TEXTOS[chave]
  const limite = 'multilinha' in definicao && definicao.multilinha ? MAX_CARACTERES_LONGO : MAX_CARACTERES_CURTO
  if (!valor.trim()) return `“${definicao.rotulo}” não pode ficar em branco.`
  if (valor.length > limite) return `“${definicao.rotulo}” passa de ${limite} caracteres.`
  // Sem o {link}, a mensagem chegaria sem dizer de qual foto se trata.
  if (chave === 'whatsapp.mensagem_foto' && !valor.includes('{link}')) {
    return 'A mensagem sobre uma foto precisa ter {link} — é por ele que você sabe de qual foto a pessoa está falando.'
  }
  return null
}

// A tela de textos: um cartão por página do site, cada um com o próprio
// botão Salvar (mexer na Home não arrisca gravar pela metade um texto da A
// Artista que ainda está sendo escrito).
//
// Grava direto pelo client do navegador: a policy de INSERT/UPDATE de
// `textos_site` (eh_admin(), docs/sql/2026-11-23-textos-site.sql) é a
// fronteira de segurança — mesmo padrão da troca de status em ListaObras.
//
// `retratos`: o bloco de retrato de cada página (EditorRetrato), montado
// pela página do servidor e encaixado no topo do cartão daquela página.
export default function EditorTextos({
  textosIniciais,
  retratos = {},
}: {
  textosIniciais: Textos
  retratos?: Partial<Record<GrupoTextos, ReactNode>>
}) {
  // `salvos`: o que está no banco agora. `valores`: o que está nos campos.
  // A diferença entre os dois é o que falta salvar.
  const [salvos, setSalvos] = useState(textosIniciais)
  const [valores, setValores] = useState(textosIniciais)
  const [salvando, setSalvando] = useState<GrupoTextos | null>(null)
  const [avisos, setAvisos] = useState<Partial<Record<GrupoTextos, { tipo: TipoAviso; texto: string }>>>({})

  function alterar(chave: ChaveTexto, valor: string) {
    setValores((atuais) => ({ ...atuais, [chave]: valor }))
  }

  async function salvar(grupo: GrupoTextos) {
    const alteradas = chavesDoGrupo(grupo).filter((chave) => valores[chave] !== salvos[chave])

    for (const chave of alteradas) {
      const erro = validar(chave, valores[chave])
      if (erro) {
        setAvisos((atuais) => ({ ...atuais, [grupo]: { tipo: 'erro', texto: erro } }))
        return
      }
    }

    setSalvando(grupo)
    setAvisos((atuais) => ({ ...atuais, [grupo]: undefined }))

    // upsert: cria a linha se o texto ainda era o padrão (sem linha no
    // banco), atualiza se ela já existia. Um pedido só para o grupo todo.
    const agora = new Date().toISOString()
    const { error } = await createClient()
      .from('textos_site')
      .upsert(alteradas.map((chave) => ({ chave, valor: valores[chave], atualizado_em: agora })))

    setSalvando(null)

    if (error) {
      setAvisos((atuais) => ({ ...atuais, [grupo]: { tipo: 'erro', texto: 'Falha ao salvar: ' + error.message } }))
      return
    }

    setSalvos((atuais) => {
      const novos = { ...atuais }
      for (const chave of alteradas) novos[chave] = valores[chave]
      return novos
    })
    setAvisos((atuais) => ({
      ...atuais,
      [grupo]: { tipo: 'sucesso', texto: 'Salvo! O site já mostra os textos novos.' },
    }))
  }

  return (
    <div className="flex flex-col gap-8">
      {GRUPOS_TEXTOS.map(({ grupo, titulo, pagina }) => {
        const chaves = chavesDoGrupo(grupo)
        const mudou = chaves.some((chave) => valores[chave] !== salvos[chave])
        const aviso = avisos[grupo]
        const recado = RECADO_DO_GRUPO[grupo]

        return (
          <section key={grupo} className={`${CLASSE_CARTAO} p-5 md:p-7`} aria-labelledby={`grupo-${grupo}`}>
            <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-linho pb-3">
              <h2 id={`grupo-${grupo}`} className="m-0 font-serif text-[22px] font-normal">
                {titulo}
              </h2>
              {pagina && (
                <Link
                  href={pagina}
                  target="_blank"
                  className="text-xs text-fumaca underline underline-offset-[3px] hover:text-tinta"
                >
                  ver página ↗
                </Link>
              )}
            </div>

            {recado && <p className="-mt-2 mb-6 text-[13px] leading-relaxed text-fumaca">{recado}</p>}

            {retratos[grupo] && <div className="mb-8 border-b border-creme pb-8">{retratos[grupo]}</div>}

            <div className="flex flex-col gap-7">
              {chaves.map((chave) => {
                const definicao: { rotulo: string; padrao: string; multilinha?: boolean; dica?: string } =
                  CATALOGO_TEXTOS[chave]
                const id = `texto-${chave}`
                const idDica = `${id}-dica`
                const valor = valores[chave]

                return (
                  <div key={chave}>
                    <label htmlFor={id} className={CLASSE_ROTULO}>
                      {definicao.rotulo}
                    </label>
                    {definicao.multilinha ? (
                      <textarea
                        id={id}
                        value={valor}
                        onChange={(e) => alterar(chave, e.target.value)}
                        aria-describedby={definicao.dica ? idDica : undefined}
                        maxLength={MAX_CARACTERES_LONGO}
                        rows={Math.min(10, Math.max(3, Math.ceil(valor.length / 80)))}
                        className={CLASSE_AREA_TEXTO}
                      />
                    ) : (
                      <input
                        id={id}
                        type="text"
                        value={valor}
                        onChange={(e) => alterar(chave, e.target.value)}
                        aria-describedby={definicao.dica ? idDica : undefined}
                        maxLength={MAX_CARACTERES_CURTO}
                        className={CLASSE_CAMPO}
                      />
                    )}
                    <div className="mt-1.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      {definicao.dica ? (
                        <p id={idDica} className="max-w-xl text-xs leading-relaxed text-fumaca">
                          {definicao.dica}
                        </p>
                      ) : (
                        <span />
                      )}
                      {valor !== definicao.padrao && (
                        // Só troca o campo — ainda precisa clicar em Salvar.
                        <button
                          type="button"
                          onClick={() => alterar(chave, definicao.padrao)}
                          className={`${CLASSE_BOTAO_TEXTO} text-xs text-fumaca`}
                        >
                          Voltar ao texto original
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-linho pt-5">
              <button
                type="button"
                onClick={() => salvar(grupo)}
                disabled={!mudou || salvando !== null}
                className={CLASSE_BOTAO_PRIMARIO}
              >
                {salvando === grupo ? 'Salvando…' : 'Salvar'}
              </button>
              {mudou && salvando !== grupo && (
                <button
                  type="button"
                  onClick={() => {
                    // Desfaz o que foi digitado neste grupo desde o último Salvar.
                    setValores((atuais) => {
                      const novos = { ...atuais }
                      for (const chave of chaves) novos[chave] = salvos[chave]
                      return novos
                    })
                    setAvisos((atuais) => ({ ...atuais, [grupo]: undefined }))
                  }}
                  className={CLASSE_BOTAO_TEXTO}
                >
                  Desfazer alterações
                </button>
              )}
              {aviso ? (
                <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
              ) : (
                !mudou && <span className="text-xs text-fumaca">Nada para salvar.</span>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
