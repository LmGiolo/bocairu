'use client'

import { useEffect } from 'react'

// Quem decide QUANDO cada elemento animado "entrou na tela". O COMO (fade,
// subir 12px, escalonar os cartões) fica todo no CSS de globals.css.
//
// O contrato com o resto do site é por atributos HTML, não por props:
//
//   data-anim="secao"  bloco de texto/seção: entra assim que aparece na tela
//   data-anim="foto"   cartão com foto: entra quando aparece na tela E a
//                      imagem terminou de carregar (senão a animação rodaria
//                      sobre uma caixa vazia)
//   data-anim="capa"   a foto da capa da Home: mesma regra da "foto"
//
// Quando chega a hora, este componente marca o elemento com `data-visivel`
// e o CSS faz o resto. Sem JavaScript, nada fica escondido: o estado
// "antes de entrar" só existe quando o script de src/lib/animacao.ts pôs
// `data-js` no <html>.
//
// Dois casos, de propósito diferentes:
//
// 1. Primeira carga da página: o que está na tela anima (é a entrada).
// 2. Navegação dentro do site (o React troca o conteúdo): foto cuja imagem
//    já está no cache aparece direto, sem animar. A passagem de página e a
//    foto que "voa" da galeria para a obra já são o movimento desse momento;
//    animar de novo por cima seria movimento em dobro.
export default function ObservadorAnimacoes() {
  useEffect(() => {
    const raiz = document.documentElement

    function marcar(elemento: Element, valor: '' | 'ja' = '') {
      elemento.setAttribute('data-visivel', valor)
    }

    // Foto/capa: espera a imagem. `complete` já é true se ela veio do cache.
    function marcarQuandoCarregar(elemento: Element) {
      const imagem = elemento.querySelector('img')
      if (!imagem || imagem.complete) {
        marcar(elemento)
        return
      }
      // `once`: o ouvinte se remove sozinho depois da primeira vez. Erro
      // também marca — melhor mostrar a caixa vazia do que esconder pra
      // sempre.
      imagem.addEventListener('load', () => marcar(elemento), { once: true })
      imagem.addEventListener('error', () => marcar(elemento), { once: true })
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          // Entrou uma vez, acabou: ninguém "sai e entra de novo".
          observador.unobserve(entrada.target)
          if (entrada.target.getAttribute('data-anim') === 'secao') {
            marcar(entrada.target)
          } else {
            marcarQuandoCarregar(entrada.target)
          }
        }
      },
      // -8% embaixo: o elemento precisa subir um pouco além da borda antes
      // de entrar — senão a animação acontece rente ao rodapé da tela, onde
      // quase ninguém está olhando.
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )

    function pendentes(): Element[] {
      return Array.from(document.querySelectorAll('[data-anim]:not([data-visivel])'))
    }

    // Caso 1: o que já está na página quando o React acorda.
    for (const elemento of pendentes()) observador.observe(elemento)

    // Caso 2: o que entra depois (navegação, filtro da galeria). O
    // MutationObserver avisa quando nós do DOM são adicionados.
    //
    // A checagem de cache é feita aqui, na hora — e não pelo
    // IntersectionObserver, que responde só no quadro seguinte. Na navegação
    // com view transition, o navegador fotografa a página nova logo depois
    // da troca; se a foto ainda estivesse no estado "antes de entrar" nesse
    // instante, a passagem terminaria numa foto invisível.
    const mutacoes = new MutationObserver(() => {
      for (const elemento of pendentes()) {
        const tipo = elemento.getAttribute('data-anim')
        const imagem = elemento.querySelector('img')
        if (tipo !== 'secao' && imagem?.complete) {
          marcar(elemento, 'ja')
        } else {
          observador.observe(elemento) // observar duas vezes não faz nada
        }
      }
    })
    mutacoes.observe(document.body, { childList: true, subtree: true })

    // Cabeçalho: depois de 40px de rolagem ele encolhe e, na Home, deixa de
    // ser transparente (mesmo limite do protótipo). Aqui é só um atributo
    // no <html>; o CSS decide o resto. `requestAnimationFrame` junta vários
    // eventos de rolagem num só por quadro.
    let agendado = false
    function aoRolar() {
      if (agendado) return
      agendado = true
      requestAnimationFrame(() => {
        agendado = false
        if (window.scrollY > 40) raiz.setAttribute('data-rolou', '')
        else raiz.removeAttribute('data-rolou')
      })
    }
    aoRolar()
    // passive: promete ao navegador que não vamos cancelar a rolagem, o que
    // o deixa rolar sem esperar este código.
    window.addEventListener('scroll', aoRolar, { passive: true })

    return () => {
      observador.disconnect()
      mutacoes.disconnect()
      window.removeEventListener('scroll', aoRolar)
    }
  }, [])

  return null
}
