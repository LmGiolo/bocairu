# Bocairú — Handoff de Design e Estado do Projeto

> Documento de referência para construção das telas.
> Fonte: Design Doc v1.0 (Jul 2026) + estado atual do código.
> **Leia antes de construir qualquer tela da vitrine.**

---

## 1. O que é este projeto

Site de venda de fotografia fine art da artista **Bocairú**. Obras vendidas
**sob encomenda**: o cliente faz o pedido, ela produz a impressão depois.
Não há controle de estoque, e **não há tiragem limitada** — as obras não
têm limite de venda.

**Princípio norteador do design:** *"uma galeria digital que se comporta como
uma galeria física"*. Catálogo curado, não vasto. Cada obra tratada como peça
única, com storytelling forte, sem ruído institucional de e-commerce.

---

## 2. Design System

### Paleta

| Token | Hex | Uso |
|---|---|---|
| Ivory / BG | `#F5F1EA` | Fundo principal |
| Sand / BG alt | `#EDE6D8` | Fundo alternativo |
| Ink / Texto | `#1B1814` | Texto e ações primárias |
| Ink Muted | `#6B6459` | Texto secundário |
| Gold / Destaque | `#A9814A` | Acento pontual (linhas, ícones, hover, foco) |
| Bordô / Ação | `#7A2E32` | CTAs de conversão, estados "exclusivo/vendido" |
| Bordô escuro | `#5C1F24` | Hover de links |
| Sucesso | `#2F5233` | |
| Erro | `#B8492E` | |
| Hairline | `#DCD4C4` | Separadores e bordas de card |
| Superfície | `#FFFFFF` | |

**Regra:** nunca mais de 2 cores de destaque na mesma tela.

### Tipografia

**Instrument Serif** (display) + **Work Sans** (UI). Ambas Google Fonts.

| Estilo | Tamanho / Peso / Ajuste |
|---|---|
| Display / H1 | 64 / 400 / -1% |
| H2 | 40 / 400 |
| H3 | 28 / 400 |
| Body L (narrativa) | 18 / 400 / line-height 1.6 |
| Body M (interface) | 16 / 400 / line-height 1.6 |
| Overline | 12 / 600 / caixa alta |

### Grid e espaçamento

- 12 colunas, max-width **1440px**
- Margem: 96px desktop · 48px tablet · 24px mobile
- Gutter: 32px desktop · 24px tablet · 16px mobile
- Escala de espaçamento (base 4px): 4, 8, 16, 24, 32, 48, 64, 96

### Raio de borda (deliberadamente contido)

- Imagens/molduras: **0**
- Cards/inputs: **2–6px**
- Tags e botões: **pill**
- Nunca cantos muito arredondados — mantém o rigor editorial.

### Bordas e sombras

- Separadores e cards: hairline `#DCD4C4`. **Cards usam borda, não sombra.**
- Ink 1px para foco e ênfase.
- Sombra só em elementos flutuantes (modais, dropdowns, drawers).
  **Nunca em cards de obra no grid.**

### Botões

| Tipo | Uso |
|---|---|
| Primário (ink sólido) | Ação principal da tela |
| Secundário (outline) | Navegação e detalhe |
| Terciário (link sublinhado) | Ações de baixa hierarquia |
| Bordô | Compra direta |
| Desabilitado | Obra indisponível |

### Inputs

- Inputs de linha única: **underline** (tom editorial)
- Textarea e selects: borda completa
- Seletor de tamanho: **pills (radio group)**, estado ativo em ink sólido

---

## 3. Especificação das telas

### Página da Obra (prioridade atual)

- **Split-screen:** imagem dominante à esquerda, informação à direita.
  A obra **nunca** some abaixo da dobra.
- Ficha técnica objetiva: título, ano, técnica, dimensões.
- Narrativa curta: 1 parágrafo curatorial. Sem excesso institucional.
- Ação principal contextual: disponível → botão de compra com preço.
  Indisponível → CTA para obras semelhantes.
- Selo de autenticidade discreto (não banner promocional).
- Obras relacionadas da mesma série, 3–4 cards, no rodapé.
- **Sem parcelamento agressivo.**

### Galeria

- Cabeçalho de contexto: título da série ativa ou "Todas as obras" + contagem.
- Barra de filtros horizontal: série, técnica, disponibilidade, orientação,
  faixa de tamanho. Em mobile vira drawer.
- **Grade assimétrica** 2–3 colunas no desktop, respeitando a proporção real
  de cada obra — **sem forçar crop quadrado**. Reforça senso de peça única.
- Card de obra: imagem, título, técnica/ano, status, preço.
  Hover revela zoom sutil, **sem "adicionar ao carrinho" precipitado**.
- Carregamento incremental com skeleton, sem paginação numerada.

### Home

- Hero editorial: uma obra em tela cheia + nome da artista + frase de
  posicionamento. **Sem carrossel de banners** — uma única imagem forte.
- Faixa de destaque: 3 obras selecionadas em cards grandes.
- Séries/Coleções: navegação por narrativa visual.
- Bloco "sobre a artista" com retrato + link para biografia.
- Prova de confiança: certificado, processo de produção, 1–2 depoimentos.
- CTA final: encomenda sob medida / newsletter.

---

## 4. Animações

Movimento discreto, **nunca decorativo**.

- **Entrada:** fade + translateY(12px)→0, 500ms, `cubic-bezier(0.16,1,0.3,1)`.
  Grids com stagger de 60ms por item.
- **Hover:** imagem `scale(1.03)` 600ms ease-out. Botão: wipe da esquerda 250ms.
  Card: borda hairline → ink, **sem sombra pop**.
- **Scroll:** reveal-on-scroll (IntersectionObserver) fade+up por seção.
  Header encolhe 80px→56px. Parallax sutil (0.9x) só no hero da Home.
- **Loading:** skeleton shimmer nos cards. Spinner de linha fina (não bolinhas).
- **Transição de página:** cross-fade 350ms. Galeria → Obra: view transition
  com imagem compartilhada.
- **Sempre respeitar `prefers-reduced-motion`** — nesse caso, só fade.

---

## 5. Responsividade

Breakpoints: Desktop ≥1280px · Tablet 768–1279px · Mobile <768px

| Tela | Desktop | Tablet | Mobile |
|---|---|---|---|
| Home | Hero 100vh, 3 obras lado a lado | Hero 70vh, 2 colunas | Hero 85vh, carrossel swipe |
| Galeria | Grade 3 col, filtros em barra | Grade 2 col, filtros em drawer | Grade 1 col, filtros em bottom sheet |
| Página da Obra | Split 60/40 | Split 55/45 | Empilhado; CTA sticky no rodapé |

---

## 6. Acessibilidade — WCAG 2.1 AA como piso

- **Contraste:** Ink sobre Ivory ≈ 15.8:1. Gold **só** em elementos ≥18px ou
  não-textuais (falha AA em texto pequeno).
- Estados de erro/sucesso sempre com ícone + texto, **nunca só cor**.
- Foco visível: outline 2px gold, offset 2px, em todo elemento interativo.
- Skip-to-content antes do header. Ordem de tabulação segue ordem visual.
- Modais/drawers: trap de foco + fechar com Esc.
- Alt text descritivo por obra (técnica + composição), não decorativo.
- Hierarquia de headings sequencial, sem pular níveis.
- Formulários com label associado, **nunca placeholder-only**.

---

## 7. Estado atual do código

### Pronto e testado

- **Fundação:** Next.js (App Router, TypeScript, Tailwind v4, `src/`) + Supabase.
- **Banco:** tabelas `perfis`, `obras` (+ `largura_px`/`altura_px`), `tamanhos`,
  `pedidos`, `pedido_itens`, com RLS ativo em todas.
- **Auth:** login e-mail+senha em `/entrar`; `/admin` protegida por dupla
  checagem (sessão + `perfis.papel = 'admin'`).
- **Upload:** rota `/api/obras` processa a imagem com `sharp` — versão web
  (webp q82, lado máx 2000px) no bucket público `obras-web`, original no
  bucket privado `obras-alta`. Grava `largura_px`/`altura_px` a partir do
  `info` que o sharp devolve depois de `.rotate()` + `.resize()` (proporção
  já corrigida pro que a tela mostra). Compensação (pilha de desfazer) se
  algo falha.
- **Admin:** `FormularioObra.tsx` cadastra obra completa com ficha técnica e
  lista dinâmica de tamanhos.
- **Design System (tokens):** paleta editorial e tipografia (Instrument
  Serif + Work Sans) em `globals.css`/`layout.tsx`.
- **Componentes base:** Cabeçalho, Rodapé (`src/components/layout/`), Botão
  (4 variantes) e CartaoObra (`src/components/ui/`). Páginas públicas
  agrupadas em `src/app/(site)/` — ganham Cabeçalho/Rodapé automaticamente;
  `/admin` e `/entrar` ficam fora desse grupo, sem esse chrome.
- **`/obras/[id]`:** Página da Obra completa — split-screen com proporção
  real da imagem, seletor de tamanho, ficha técnica, preço/CTA, certificado
  de autenticidade, obras relacionadas da mesma série. O tamanho selecionado
  fica sincronizado entre esses blocos via `ContextoTamanho`
  (`src/components/obra/`).
- **`/galeria`:** grade em mosaico real (CSS `columns`, sem crop quadrado),
  filtros de coleção/tamanho/orientação/faixa de preço montados
  dinamicamente a partir do que existe no catálogo (nada hardcoded), busca
  por título. `src/components/galeria/`.

### A construir

1. **Home** ← prioridade
2. Página de Série/Coleção
3. A Artista
4. Carrinho / checkout (total sempre recalculado no servidor)
5. Pagamento (Mercado Pago — Pix + cartão)
6. Refinar Admin (estilos + lista de obras pra editar/despublicar)
7. Deploy (Vercel)

---

## 8. Decisões já tomadas — não reabrir

- **Sem marca d'água.** A proteção da obra vem da dimensão reduzida da versão
  web (menos pixels que o original, não serve para impressão grande).
- **Sem tiragem/edição limitada.** As obras não têm limite de venda.
  Não introduzir conceito de "edição 3/10" mesmo que o Design Doc mencione —
  aquilo foi descartado pela artista.
- **Ficha técnica varia por obra** (técnica, material, impressão, papel são
  colunas em `obras`, não constantes no código).
- **Preços sempre em centavos** (inteiro). Nunca float — `parseFloat('19.99')*100`
  dá `1998.9999...`.
- **`service_role` nunca no navegador.** Sem prefixo `NEXT_PUBLIC_`, e o módulo
  que a usa importa `server-only`.
- **RLS é a fonte da verdade** para filtrar obras publicadas. Não adicionar
  filtro de `status` no código da galeria.
- **Proporção real da imagem** vem de `obras.largura_px`/`altura_px`
  (gravadas no upload, ver §7). CartaoObra e a Página da Obra usam essa
  proporção; cai num `4/5` só quando as colunas são `null` (obras
  cadastradas antes delas existirem). Não forçar crop quadrado em lugar
  nenhum da vitrine.
- **Só uma imagem por obra.** Sem tabela de fotos múltiplas no schema — por
  isso a Página da Obra não tem tira de miniaturas nem uma segunda foto na
  seção "História da obra". Adicionar isso é mudança de schema, não decisão
  de tela.
- **Disponibilidade é só `tamanhos.disponivel`.** A obra em si nunca
  "esgota" (sob encomenda, sem tiragem — ver acima); não introduzir estado
  de "vendida" nem "sob consulta" pra obra inteira, só disponível/
  indisponível por tamanho.
- **CTA "Adquirir esta obra" aponta pra `/entrar`** como placeholder até o
  Checkout/Reserva (item da seção 7) existir de verdade.
- **Filtros da Galeria seguem o protótipo, não o texto desta seção 3**
  (que diverge do que foi de fato construído): Coleção, Tamanho, Orientação
  e faixa de preço. Sem filtro de técnica nem de disponibilidade.

---

## 9. Schema relevante

**`obras`:** `id`, `titulo`, `descricao`, `ano`, `imagem_web` (URL pública),
`imagem_alta` (caminho no bucket privado), `largura_px`, `altura_px`
(dimensões da imagem web, nullable — obras antigas ainda não têm), `status`,
`ordem`, `serie`, `historia`, `historia_titulo`, `tecnica`, `material`,
`impressao`, `papel`, `criado_em`, `atualizado_em`

**`tamanhos`:** `id`, `obra_id` (FK → obras), `rotulo`, `largura_cm`,
`altura_cm`, `preco_centavos`, `ativo`, `ordem`, `disponivel`, `prazo_dias`,
`criado_em`

Relacionamento **um-para-muitos**: uma obra tem vários tamanhos.
Leitura com join: `.select('*, tamanhos(*)')`

---

*Design Doc v1.0 — Julho 2026. Handoff compilado para desenvolvimento.*
