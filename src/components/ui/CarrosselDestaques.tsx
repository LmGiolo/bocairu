'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  ViewTransition,
  type PointerEvent,
  type ReactNode,
} from 'react'

export type ObraDestaque = {
  id: string
  titulo: string
  subtitulo: string
  imagem_web: string
}

// Quanto tempo cada foto fica na frente quando o carrossel gira sozinho.
const INTERVALO_MS = 5000

// A "Seleção atual" da Home (posições 2 a 4 da Ordem do site) como um ANEL
// 3D: a foto da frente fica nítida e grande; as vizinhas, de cada lado,
// ficam mais atrás, giradas para dentro e desfocadas. Ao avançar, o anel
// gira: a da direita vem para a frente, a da frente vai para a esquerda, e
// a da esquerda passa POR TRÁS até o outro lado. Não tem começo nem fim.
//
// Este componente só decide a POSIÇÃO de cada foto em relação à da frente
// (`data-posicao`: 0 = frente, 1 = direita, -1 = esquerda, "fora" = as
// demais, se um dia houver mais de 3). O movimento todo é CSS (bloco
// "Carrossel da Home" em globals.css), como o resto das animações do site.
//
// Gira sozinho a cada 5s, mas para quando: o mouse está em cima, algo dentro
// dele tem foco, a seção saiu da tela, a pessoa apertou "Pausar" ou o
// sistema pede menos movimento. Celular: arrastar para o lado. Computador:
// setas, pontinhos ou clique numa foto do lado.
export default function CarrosselDestaques({
  obras,
  titulo,
  acaoExtra,
}: {
  obras: ObraDestaque[]
  // O cabeçalho da seção (sobretítulo + título), desenhado por quem usa.
  titulo: ReactNode
  // Link "Ver toda a galeria →", ao lado do título.
  acaoExtra?: ReactNode
}) {
  const total = obras.length
  const [atual, setAtual] = useState(0)
  const obraAtual = obras[atual]

  // ── Giro automático e o que o pausa ──
  const secao = useRef<HTMLElement>(null)
  const [pausadoPelaPessoa, setPausadoPelaPessoa] = useState(false)
  const [interagindo, setInteragindo] = useState(false)
  const [naTela, setNaTela] = useState(false)
  const menosMovimento = useMenosMovimento()
  const podeGirarSozinho = total > 1 && !menosMovimento
  const girando = podeGirarSozinho && !pausadoPelaPessoa && !interagindo && naTela

  // Só gira enquanto a seção está visível: ninguém vê o giro lá embaixo.
  useEffect(() => {
    const el = secao.current
    if (!el) return
    const observador = new IntersectionObserver(([entrada]) => setNaTela(entrada.isIntersecting), {
      threshold: 0.4,
    })
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  // Um "timer" por foto: como `atual` está nas dependências, mudar de foto
  // na mão (seta, arraste) recomeça a contagem dos 5s.
  useEffect(() => {
    if (!girando) return
    const temporizador = setTimeout(() => setAtual((a) => (a + 1) % total), INTERVALO_MS)
    return () => clearTimeout(temporizador)
  }, [girando, atual, total])

  // Anel: passar da última volta para a primeira (e vice-versa).
  function irPara(indice: number) {
    setAtual(((indice % total) + total) % total)
  }

  // Posição de cada foto em relação à da frente, já "dando a volta": com 3
  // fotos, a que vem duas depois é a mesma que vem uma antes (-1).
  function posicaoDe(indice: number): '0' | '1' | '-1' | 'fora' {
    let relativa = (((indice - atual) % total) + total) % total
    if (relativa > total / 2) relativa -= total
    if (relativa === 0 || relativa === 1 || relativa === -1) return String(relativa) as '0' | '1' | '-1'
    return 'fora'
  }

  // ── Arrastar (celular) ──
  // Guarda onde o dedo encostou. Se andou mais para o lado do que para
  // cima/baixo, é um "girar" — e o clique que o navegador dispara ao soltar
  // não pode abrir a obra.
  const inicioArraste = useRef<{ x: number; y: number } | null>(null)
  const arrastou = useRef(false)

  function aoEncostar(evento: PointerEvent) {
    inicioArraste.current = { x: evento.clientX, y: evento.clientY }
    arrastou.current = false
  }

  function aoSoltar(evento: PointerEvent) {
    const inicio = inicioArraste.current
    inicioArraste.current = null
    if (!inicio) return
    const dx = evento.clientX - inicio.x
    const dy = evento.clientY - inicio.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    arrastou.current = true
    // Arrastar para a esquerda puxa a foto da direita para a frente.
    irPara(atual + (dx < 0 ? 1 : -1))
  }

  const CLASSE_SETA =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-linho text-tinta transition-colors duration-200 hover:border-tinta'

  return (
    <section
      ref={secao}
      aria-roledescription="carrossel"
      aria-label="Seleção atual"
      // `overflow-x-clip`: as fotos dos lados passam um pouco da borda no
      // celular — sem isso, a página ganharia rolagem lateral.
      className="overflow-x-clip py-20 md:py-28"
      onMouseEnter={() => setInteragindo(true)}
      onMouseLeave={() => setInteragindo(false)}
      onFocus={() => setInteragindo(true)}
      onBlur={(evento) => {
        // `onBlur` dispara também quando o foco só pula de um botão para
        // outro DENTRO da seção; só conta como "saiu" se foi para fora.
        if (!evento.currentTarget.contains(evento.relatedTarget)) setInteragindo(false)
      }}
    >
      <div
        className="mx-auto mb-12 flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-6 md:mb-16 md:px-12 lg:px-24"
        data-anim="secao"
      >
        {titulo}
        {acaoExtra}
      </div>

      {/* O palco: `perspective` (no CSS) dá a profundidade; o trilho tem o
          tamanho da foto da frente, e as outras se posicionam a partir
          dele. `touch-pan-y`: o dedo continua rolando a página para
          cima/baixo, mas o arraste para o lado fica com a gente. */}
      <div
        className="anim-anel flex touch-pan-y select-none justify-center"
        data-anim="secao"
        onPointerDown={aoEncostar}
        onPointerUp={aoSoltar}
        onPointerCancel={() => (inicioArraste.current = null)}
        onClickCapture={(evento) => {
          if (!arrastou.current) return
          arrastou.current = false
          evento.preventDefault()
          evento.stopPropagation()
        }}
      >
        <div className="anim-anel-trilho relative aspect-[4/5] w-[62vw] max-w-[420px] sm:w-[44vw] lg:w-[30vw]">
          {obras.map((obra, indice) => {
            const posicao = posicaoDe(indice)
            const naFrente = posicao === '0'
            return (
              <div
                key={obra.id}
                className="anim-anel-cartao group absolute inset-0"
                data-posicao={posicao}
                // Só a da frente é lida pelo leitor de tela; as dos lados
                // são enfeite clicável (quem usa teclado tem as setas).
                aria-hidden={!naFrente}
              >
                <Link
                  href={`/obras/${obra.id}`}
                  tabIndex={naFrente ? undefined : -1}
                  draggable={false}
                  className="anim-moldura block h-full overflow-hidden border border-linho bg-creme"
                  // Clique numa foto do lado gira o anel até ela, em vez de
                  // abrir a obra.
                  onClick={(evento) => {
                    if (naFrente) return
                    evento.preventDefault()
                    irPara(indice)
                  }}
                >
                  {/* Mesmo `name` da foto na Página da Obra: ao clicar, a
                      foto "voa" do carrossel até lá (como no CartaoObra). */}
                  <ViewTransition name={`foto-${obra.id}`} share="morph" default="none">
                    <div className="relative h-full w-full">
                      <Image
                        src={obra.imagem_web}
                        alt={obra.titulo}
                        fill
                        draggable={false}
                        className="anim-foto-img object-cover"
                        sizes="(min-width: 1400px) 420px, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 62vw"
                      />
                    </div>
                  </ViewTransition>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda entre as setas. `aria-live`: quem usa leitor de tela ouve
          o título da foto nova quando o anel gira. */}
      {obraAtual && (
        <div className="mt-10 flex items-center justify-center gap-5 px-6 md:mt-14 md:gap-8">
          {total > 1 && (
            <button type="button" onClick={() => irPara(atual - 1)} aria-label="Foto anterior" className={CLASSE_SETA}>
              <span aria-hidden="true">←</span>
            </button>
          )}
          <div aria-live="polite" className="w-56 text-center sm:w-72">
            {/* `key`: foto nova = legenda nova, que entra com fade. */}
            <div key={obraAtual.id} className="anim-legenda">
              <Link href={`/obras/${obraAtual.id}`} className="text-base font-medium text-tinta hover:underline">
                {obraAtual.titulo}
              </Link>
              {obraAtual.subtitulo && <div className="mt-1 text-sm text-fumaca">{obraAtual.subtitulo}</div>}
            </div>
          </div>
          {total > 1 && (
            <button type="button" onClick={() => irPara(atual + 1)} aria-label="Próxima foto" className={CLASSE_SETA}>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}

      {total > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {obras.map((obra, indice) => (
            <button
              key={obra.id}
              type="button"
              onClick={() => irPara(indice)}
              aria-label={`Foto ${indice + 1} de ${total}`}
              aria-current={indice === atual ? 'true' : undefined}
              // O pontinho é pequeno, mas o botão em volta tem área de
              // toque confortável (p-2).
              className="p-2"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${indice === atual ? 'w-6 bg-tinta' : 'w-1.5 bg-linho'}`}
              />
            </button>
          ))}

          {/* Pausar: quem precisa de tempo para olhar (ou se incomoda com
              movimento) pode parar o giro automático. */}
          {podeGirarSozinho && (
            <button
              type="button"
              onClick={() => setPausadoPelaPessoa((p) => !p)}
              aria-label={pausadoPelaPessoa ? 'Continuar o giro automático' : 'Pausar o giro automático'}
              className="ml-3 flex h-8 w-8 items-center justify-center rounded-full text-xs text-fumaca transition-colors duration-200 hover:text-tinta"
            >
              <span aria-hidden="true">{pausadoPelaPessoa ? '▶' : '❚❚'}</span>
            </button>
          )}
        </div>
      )}
    </section>
  )
}

// "Reduzir movimento" do sistema (acessibilidade). `useSyncExternalStore`
// lê o valor do navegador e re-renderiza se a pessoa mudar a preferência;
// no servidor (onde não existe `matchMedia`) assume `true`, então nada gira
// antes de o navegador confirmar.
const CONSULTA_MENOS_MOVIMENTO = '(prefers-reduced-motion: reduce)'
function useMenosMovimento() {
  return useSyncExternalStore(
    (avisar) => {
      const consulta = window.matchMedia(CONSULTA_MENOS_MOVIMENTO)
      consulta.addEventListener('change', avisar)
      return () => consulta.removeEventListener('change', avisar)
    },
    () => window.matchMedia(CONSULTA_MENOS_MOVIMENTO).matches,
    () => true,
  )
}
