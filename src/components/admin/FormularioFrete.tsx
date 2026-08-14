'use client'

import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { precoParaCentavos } from '@/lib/obras/formulario'
import { REGIOES, ROTULOS_REGIAO, type Regiao } from '@/lib/frete/regiao'
import { PORTES, ROTULOS_PORTE, type Porte } from '@/lib/obras/porte'
import type { LinhaFrete } from '@/lib/frete/calcular'

function chave(regiao: Regiao, porte: Porte) {
  return `${regiao}:${porte}`
}

// Grade regiao × porte inteira (5 × 3 = 15 campos), sempre renderizada
// completa mesmo que `fretes` venha vazia — é assim que a primeira
// configuração acontece: a artista preenche o que quiser e salva, sem
// precisar de seed manual no banco (ver docs/handoff.md). Deixar um campo
// em branco não apaga nada, só pula aquela linha no upsert.
export default function FormularioFrete({ fretes }: { fretes: LinhaFrete[] }) {
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const iniciais: Record<string, string> = {}
    for (const linha of fretes) {
      iniciais[chave(linha.regiao, linha.porte)] = (linha.valor_centavos / 100)
        .toFixed(2)
        .replace('.', ',')
    }
    return iniciais
  })
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const supabase = createClient()

  function alterar(regiao: Regiao, porte: Porte, valor: string) {
    setValores((atuais) => ({ ...atuais, [chave(regiao, porte)]: valor }))
  }

  async function salvar() {
    setSalvando(true)
    setMensagem('')

    const linhas: Array<{ regiao: Regiao; porte: Porte; valor_centavos: number }> = []
    const invalidas: string[] = []

    for (const regiao of REGIOES) {
      for (const porte of PORTES) {
        const texto = (valores[chave(regiao, porte)] ?? '').trim()
        if (!texto) continue

        const centavos = precoParaCentavos(texto)
        if (centavos === null) {
          invalidas.push(`${ROTULOS_REGIAO[regiao]} / ${ROTULOS_PORTE[porte]}`)
          continue
        }

        linhas.push({ regiao, porte, valor_centavos: centavos })
      }
    }

    if (invalidas.length > 0) {
      setMensagem('Valor inválido em: ' + invalidas.join(', '))
      setSalvando(false)
      return
    }

    if (linhas.length === 0) {
      setMensagem('Preencha ao menos um valor antes de salvar.')
      setSalvando(false)
      return
    }

    const { error } = await supabase.from('fretes').upsert(linhas, { onConflict: 'regiao,porte' })

    setMensagem(error ? 'Falha ao salvar: ' + error.message : 'Salvo!')
    setSalvando(false)
  }

  return (
    <div>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 16, maxWidth: 560 }}>
        Valor de frete e seguro por região de entrega e porte da impressão. No carrinho, cada
        item paga o valor do próprio porte × quantidade — cada impressão viaja como peça
        própria. Deixe em branco o que ainda não quiser configurar.
      </p>

      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: 8, textAlign: 'left' }}></th>
            {PORTES.map((porte) => (
              <th key={porte} style={{ padding: 8, textAlign: 'left' }}>
                {ROTULOS_PORTE[porte]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {REGIOES.map((regiao) => (
            <tr key={regiao} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 8, fontWeight: 500 }}>{ROTULOS_REGIAO[regiao]}</td>
              {PORTES.map((porte) => (
                <td key={porte} style={{ padding: 8 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valores[chave(regiao, porte)] ?? ''}
                    onChange={(e) => alterar(regiao, porte, e.target.value)}
                    style={{ padding: 6, width: 110 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={salvar} disabled={salvando} style={{ padding: 8, marginTop: 16 }}>
        {salvando ? 'Salvando...' : 'Salvar valores'}
      </button>

      {mensagem && <p style={{ marginTop: 8 }}>{mensagem}</p>}
    </div>
  )
}
