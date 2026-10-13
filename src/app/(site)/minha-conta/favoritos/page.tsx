import { exigirUsuario } from '@/lib/conta/sessao'
import { formatarCentavos } from '@/lib/obras/formulario'
import Botao from '@/components/ui/Botao'
import CartaoObra from '@/components/ui/CartaoObra'
import Titulo from '@/components/conta/Titulo'
import BotaoFavoritar from '@/components/obra/BotaoFavoritar'

type ObraFavorita = {
  id: string
  titulo: string
  tecnica: string | null
  ano: number | null
  imagem_web: string
  largura_px: number | null
  altura_px: number | null
  tamanhos: Array<{ preco_centavos: number; disponivel: boolean }>
}

export default async function Favoritos() {
  const { supabase, user } = await exigirUsuario('/minha-conta/favoritos')

  const { data, error } = await supabase
    .from('favoritos')
    .select(
      'criado_em, obras(id, titulo, tecnica, ano, imagem_web, largura_px, altura_px, tamanhos(preco_centavos, disponivel))'
    )
    .eq('cliente_id', user.id)
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Não foi possível carregar os favoritos: ${error.message}`)
  }

  // Obra que a artista despublicou depois de favoritada: o RLS esconde a
  // linha de `obras` e o join volta null. Some da lista em silêncio — o
  // favorito continua salvo e reaparece se a obra voltar a ser publicada.
  const obras = (data ?? [])
    .map((linha) => linha.obras as unknown as ObraFavorita | null)
    .filter((obra): obra is ObraFavorita => obra !== null)

  return (
    <>
      <Titulo overline="Curadoria pessoal">Favoritos</Titulo>

      {obras.length === 0 ? (
        <div className="border border-linho bg-white px-6 py-10 text-center">
          <div className="mb-3 font-serif text-2xl italic text-tinta">Nenhuma obra favoritada.</div>
          <p className="mb-7 text-sm text-fumaca">
            Toque no coração na página de uma obra para guardá-la aqui.
          </p>
          <Botao variante="secundario" href="/galeria">
            Ver a galeria
          </Botao>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          {obras.map((obra) => {
            // Mesma regra de "a partir de" da Galeria e da Home: menor preço
            // entre os tamanhos disponíveis.
            const precos = obra.tamanhos.filter((t) => t.disponivel).map((t) => t.preco_centavos)
            const disponivel = precos.length > 0

            return (
              <div key={obra.id} className="relative">
                <CartaoObra
                  href={`/obras/${obra.id}`}
                  imagemUrl={obra.imagem_web}
                  titulo={obra.titulo}
                  subtitulo={[obra.tecnica, obra.ano].filter(Boolean).join(' · ')}
                  status={disponivel ? 'Disponível' : 'Sob consulta'}
                  precoLabel={disponivel ? `A partir de ${formatarCentavos(Math.min(...precos))}` : undefined}
                  larguraPx={obra.largura_px}
                  alturaPx={obra.altura_px}
                />
                <div className="absolute top-2.5 right-2.5">
                  <BotaoFavoritar obraId={obra.id} favoritoInicial logado variante="cartao" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
