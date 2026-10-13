'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { validarEndereco, type EnderecoEntrega } from '@/lib/pedidos/formulario'
import Botao from '@/components/ui/Botao'
import Titulo from '@/components/conta/Titulo'
import Aviso from '@/components/conta/Aviso'

export type EnderecoSalvo = EnderecoEntrega & {
  id: string
  apelido: string | null
  padrao: boolean
}

const CLASSE_INPUT =
  'w-full border-b border-linho bg-transparent py-2.5 text-base text-tinta outline-none transition-colors duration-200 focus:border-tinta'
const CLASSE_LABEL = 'mb-1.5 block text-xs uppercase tracking-widest text-fumaca'
const CLASSE_LINK = 'underline underline-offset-4 transition-colors duration-200 hover:text-vinho-escuro'

const MAX_CARACTERES_APELIDO = 60

const CAMPOS_VAZIOS = {
  apelido: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
}

type Campos = typeof CAMPOS_VAZIOS

function formatarCep(cep: string) {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep
}

// Endereços salvos da cliente. Escreve DIRETO no Supabase pelo client do
// navegador (mesmo padrão das listas do admin) — não existe rota de API
// aqui porque não há nada a recalcular no servidor: quem garante que cada
// um só mexe nos próprios endereços é o RLS (docs/sql/2026-10-13-minha-conta.sql),
// e os CHECKs da tabela repetem as regras de formato.
//
// A validação de campos é a MESMA função do checkout (`validarEndereco`),
// então um endereço salvo aqui sempre passa quando vira endereço de entrega.
export default function GerenciadorEnderecos({ enderecos }: { enderecos: EnderecoSalvo[] }) {
  const router = useRouter()
  const supabase = createClient()

  // null = formulário fechado; 'novo' = cadastrando; um id = editando aquele.
  const [editando, setEditando] = useState<string | null>(null)
  const [campos, setCampos] = useState<Campos>(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function alterar(campo: keyof Campos, valor: string) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }))
  }

  function abrirNovo() {
    setCampos(CAMPOS_VAZIOS)
    setErro('')
    setEditando('novo')
  }

  function abrirEdicao(endereco: EnderecoSalvo) {
    setCampos({
      apelido: endereco.apelido ?? '',
      cep: formatarCep(endereco.cep),
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento ?? '',
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
    })
    setErro('')
    setEditando(endereco.id)
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro('')

    const { apelido, ...endereco } = campos
    const validado = validarEndereco(endereco)
    if (!validado.ok) {
      setErro(validado.erro)
      return
    }

    const apelidoLimpo = apelido.trim()
    if (apelidoLimpo.length > MAX_CARACTERES_APELIDO) {
      setErro(`Apelido passa de ${MAX_CARACTERES_APELIDO} caracteres.`)
      return
    }

    setSalvando(true)
    const linha = { ...validado.valor, apelido: apelidoLimpo || null }

    const { error } =
      editando === 'novo'
        ? await supabase
            .from('enderecos')
            // O primeiro endereço já nasce padrão — é o que o checkout vai
            // pré-preencher. `cliente_id` não vai: o banco preenche com
            // auth.uid() (default da coluna).
            .insert({ ...linha, padrao: enderecos.length === 0 })
        : await supabase.from('enderecos').update(linha).eq('id', editando)

    setSalvando(false)

    if (error) {
      setErro('Não foi possível salvar o endereço. Tente de novo.')
      return
    }

    setEditando(null)
    router.refresh()
  }

  async function definirPadrao(id: string) {
    setErro('')
    // RPC em vez de dois updates daqui: trocar o padrão é desmarcar um e
    // marcar outro, e a função faz os dois numa transação só.
    const { error } = await supabase.rpc('definir_endereco_padrao', { p_endereco_id: id })
    if (error) {
      setErro('Não foi possível definir o endereço padrão.')
      return
    }
    router.refresh()
  }

  async function excluir(endereco: EnderecoSalvo) {
    if (!window.confirm('Excluir este endereço?')) return
    setErro('')

    const { error } = await supabase.from('enderecos').delete().eq('id', endereco.id)
    if (error) {
      setErro('Não foi possível excluir o endereço.')
      return
    }

    // Apagou o padrão e sobrou algum? O próximo da lista assume, pra o
    // checkout continuar tendo o que pré-preencher.
    const proximo = enderecos.find((outro) => outro.id !== endereco.id)
    if (endereco.padrao && proximo) {
      await supabase.rpc('definir_endereco_padrao', { p_endereco_id: proximo.id })
    }

    if (editando === endereco.id) setEditando(null)
    router.refresh()
  }

  const formulario = (
    <form
      onSubmit={salvar}
      className="flex flex-col gap-6 border border-linho bg-white px-6 py-7 md:px-8"
      aria-label={editando === 'novo' ? 'Novo endereço' : 'Editar endereço'}
    >
      <div>
        <label className={CLASSE_LABEL} htmlFor="apelido">
          Apelido (opcional)
        </label>
        <input
          id="apelido"
          className={CLASSE_INPUT}
          placeholder="Casa, Escritório…"
          value={campos.apelido}
          onChange={(e) => alterar('apelido', e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_120px]">
        <div>
          <label className={CLASSE_LABEL} htmlFor="cep">
            CEP
          </label>
          <input
            id="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            className={CLASSE_INPUT}
            value={campos.cep}
            onChange={(e) => alterar('cep', e.target.value)}
            required
          />
        </div>
        <div>
          <label className={CLASSE_LABEL} htmlFor="numero">
            Número
          </label>
          <input
            id="numero"
            className={CLASSE_INPUT}
            value={campos.numero}
            onChange={(e) => alterar('numero', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className={CLASSE_LABEL} htmlFor="logradouro">
          Logradouro
        </label>
        <input
          id="logradouro"
          autoComplete="address-line1"
          className={CLASSE_INPUT}
          value={campos.logradouro}
          onChange={(e) => alterar('logradouro', e.target.value)}
          required
        />
      </div>

      <div>
        <label className={CLASSE_LABEL} htmlFor="complemento">
          Complemento (opcional)
        </label>
        <input
          id="complemento"
          autoComplete="address-line2"
          className={CLASSE_INPUT}
          value={campos.complemento}
          onChange={(e) => alterar('complemento', e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_1fr_80px]">
        <div>
          <label className={CLASSE_LABEL} htmlFor="bairro">
            Bairro
          </label>
          <input
            id="bairro"
            className={CLASSE_INPUT}
            value={campos.bairro}
            onChange={(e) => alterar('bairro', e.target.value)}
            required
          />
        </div>
        <div>
          <label className={CLASSE_LABEL} htmlFor="cidade">
            Cidade
          </label>
          <input
            id="cidade"
            autoComplete="address-level2"
            className={CLASSE_INPUT}
            value={campos.cidade}
            onChange={(e) => alterar('cidade', e.target.value)}
            required
          />
        </div>
        <div>
          <label className={CLASSE_LABEL} htmlFor="estado">
            UF
          </label>
          <input
            id="estado"
            maxLength={2}
            autoComplete="address-level1"
            className={`${CLASSE_INPUT} uppercase`}
            value={campos.estado}
            onChange={(e) => alterar('estado', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar endereço'}
        </Botao>
        <Botao variante="terciario" onClick={() => setEditando(null)}>
          Cancelar
        </Botao>
      </div>
    </form>
  )

  return (
    <>
      <Titulo
        overline="Entregas"
        acao={
          editando !== 'novo' && (
            <Botao onClick={abrirNovo}>
              + Novo endereço
            </Botao>
          )
        }
      >
        Endereços
      </Titulo>

      {erro && (
        <div className="mb-6">
          <Aviso tipo="erro">{erro}</Aviso>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {editando === 'novo' && formulario}

        {enderecos.length === 0 && editando !== 'novo' && (
          <div className="border border-linho bg-white px-6 py-10 text-center">
            <div className="mb-3 font-serif text-2xl italic text-tinta">Nenhum endereço salvo.</div>
            <p className="text-sm text-fumaca">
              O endereço padrão já vem preenchido quando você finaliza um pedido.
            </p>
          </div>
        )}

        {enderecos.map((endereco) =>
          editando === endereco.id ? (
            <div key={endereco.id}>{formulario}</div>
          ) : (
            <div
              key={endereco.id}
              className="flex flex-col justify-between gap-4 border border-linho bg-white px-5 py-5 sm:flex-row sm:items-start"
            >
              <div>
                <div className="mb-1 text-sm font-medium text-tinta">
                  {endereco.apelido || 'Endereço'}
                  {endereco.padrao && (
                    <span className="ml-2 text-[11px] uppercase tracking-wider text-ouro">Padrão</span>
                  )}
                </div>
                <div className="text-[13px] leading-relaxed text-fumaca">
                  {endereco.logradouro}, {endereco.numero}
                  {endereco.complemento ? `, ${endereco.complemento}` : ''} · {endereco.bairro} ·{' '}
                  {endereco.cidade}, {endereco.estado} · {formatarCep(endereco.cep)}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-4 text-[13px] text-tinta">
                {!endereco.padrao && (
                  <button type="button" className={CLASSE_LINK} onClick={() => definirPadrao(endereco.id)}>
                    Definir como padrão
                  </button>
                )}
                <button type="button" className={CLASSE_LINK} onClick={() => abrirEdicao(endereco)}>
                  Editar
                </button>
                <button
                  type="button"
                  className={`${CLASSE_LINK} text-vinho`}
                  onClick={() => excluir(endereco)}
                >
                  Excluir
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  )
}
