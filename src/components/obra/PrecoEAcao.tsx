'use client'

import { useRouter } from 'next/navigation'

import Botao from '@/components/ui/Botao'
import { formatarCentavos } from '@/lib/obras/formulario'
import { useCarrinho } from '@/components/carrinho/ContextoCarrinho'
import { useTamanho } from './ContextoTamanho'

type Props = {
  obraId: string
  titulo: string
  imagemUrl: string
  /** Série da obra, pra montar o link de "ver obras semelhantes". */
  serie: string | null
}

// Sem tiragem/edição limitada, uma obra nunca "esgota" — só um tamanho
// específico pode ficar indisponível. Por isso são só 2 estados aqui (não
// os 3 do protótipo original, que previa "vendida"/"sob consulta": nenhum
// dos dois existe no schema, ver docs/handoff.md e o plano desta tela).
export default function PrecoEAcao({ obraId, titulo, imagemUrl, serie }: Props) {
  const { selecionado } = useTamanho()
  const { adicionar } = useCarrinho()
  const router = useRouter()

  const hrefSemelhantes = serie ? `/colecoes/${encodeURIComponent(serie)}` : '/galeria'

  // O preço guardado aqui é só cache de exibição no carrinho — quem decide
  // o total cobrado de verdade é a rota /api/pedidos, relendo o preço atual
  // de `tamanhos` no momento da confirmação (ver docs/handoff.md).
  function adquirir() {
    adicionar({
      tamanhoId: selecionado.id,
      obraId,
      titulo,
      rotulo: selecionado.rotulo,
      precoCentavos: selecionado.preco_centavos,
      imagemUrl,
      porte: selecionado.porte,
    })
    router.push('/carrinho')
  }

  return (
    <div className="mb-6">
      <div
        className={`mb-4.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${
          selecionado.disponivel ? 'text-[#2F5233]' : 'text-fumaca'
        }`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            selecionado.disponivel ? 'bg-[#2F5233]' : 'bg-fumaca'
          }`}
        />
        {selecionado.disponivel ? 'Disponível' : 'Indisponível'}
      </div>

      {selecionado.disponivel ? (
        <div className="flex flex-wrap items-center gap-6">
          <div className="font-serif text-2xl text-tinta">
            {formatarCentavos(selecionado.preco_centavos)}
          </div>
          <Botao variante="bordo" onClick={adquirir}>
            Adquirir esta obra
          </Botao>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-5">
          <Botao disabled>Indisponível neste tamanho</Botao>
          <Botao variante="terciario" href={hrefSemelhantes}>
            Ver obras semelhantes →
          </Botao>
        </div>
      )}

      {selecionado.disponivel && selecionado.prazo_dias && (
        <div className="mt-5 flex items-center gap-2.5 border-t border-linho pt-5 text-sm text-fumaca">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ouro" />
          Impressão sob encomenda · pronta para envio em {selecionado.prazo_dias}
        </div>
      )}
    </div>
  )
}
