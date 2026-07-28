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

### Página da Obra (construída — ver §7)

- **Split-screen:** imagem dominante à esquerda, informação à direita.
  A obra **nunca** some abaixo da dobra.
- Ficha técnica objetiva: título, ano, técnica, dimensões.
- Narrativa curta: 1 parágrafo curatorial. Sem excesso institucional.
- Ação principal contextual: disponível → botão de compra com preço.
  Indisponível → CTA para obras semelhantes.
- Selo de autenticidade discreto (não banner promocional).
- Obras relacionadas da mesma série, 3–4 cards, no rodapé.
- **Sem parcelamento agressivo.**

### Galeria (construída — ver §7; filtros de fato implementados estão em §8, divergem do que está logo abaixo)

- Cabeçalho de contexto: título da série ativa ou "Todas as obras" + contagem.
- Barra de filtros horizontal: série, técnica, disponibilidade, orientação,
  faixa de tamanho. Em mobile vira drawer.
- **Grade assimétrica** 2–3 colunas no desktop, respeitando a proporção real
  de cada obra — **sem forçar crop quadrado**. Reforça senso de peça única.
- Card de obra: imagem, título, técnica/ano, status, preço.
  Hover revela zoom sutil, **sem "adicionar ao carrinho" precipitado**.
- Carregamento incremental com skeleton, sem paginação numerada.

### Home (prioridade atual)

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
- **`/` (Home):** hero de tela cheia com a primeira obra por `ordem` + nome
  da artista e frase de posicionamento, faixa de destaque com as 3 obras
  seguintes, navegação por série (uma obra representante por `serie`,
  linkando pra `/colecoes/[serie]`), bloco "sobre a artista" e prova de
  confiança (certificado, processo de produção, depoimento). Sem tabela
  própria pra nada disso — curadoria e copy vêm de `obras`/`ordem` e de
  texto fixo no componente (ver §8).
- **`/colecoes`:** índice de séries — mesma lógica de representante-por-série
  da Home, em página cheia. `/colecoes/[serie]`: reaproveita
  `GaleriaInterativa` (a mesma grade e filtros da `/galeria`) com a série já
  pré-selecionada via `serieInicial`, mais breadcrumb de volta. `serie`
  não bate com nenhuma obra do catálogo → `notFound()`. `CartaoSerie`
  (`src/components/colecoes/`) é compartilhado entre a Home e o índice.
- **`/a-artista`:** página estática (sem consulta ao banco) — abertura com
  retrato-placeholder + nome, biografia editorial, processo criativo em 4
  passos, CTA pra `/colecoes` e `/encomendas`. Todo o texto é copy fixo no
  componente, sem fonte de dados própria (mesma lógica da Home, ver §8).
- **Carrinho / `/finalizar-pedido` / `/pedidos/[id]`:** carrinho é só
  client-side (`useCarrinho`, `src/components/carrinho/ContextoCarrinho.tsx`
  — estado num módulo singleton sincronizado com `localStorage` via
  `useSyncExternalStore`, não Context; `useState`+`useEffect` pra hidratar
  do `localStorage` dispara "cascading render" no lint novo do React, daí a
  troca). `/entrar` ganhou modo cadastro (alimenta o trigger
  `handle_novo_usuario()` com `options.data.nome`) e `?next=` de retorno.
  `/finalizar-pedido` exige sessão (redireciona pra
  `/entrar?next=/finalizar-pedido` senão) e envia o carrinho pra `POST
  /api/pedidos`, que **relê preço e disponibilidade de `tamanhos` com o
  client de sessão** (nunca confia no preço em cache do carrinho) antes de
  gravar com `criarClientAdmin()` — não existe policy de INSERT em
  `pedidos`/`pedido_itens` de propósito, ver §8. `/pedidos/[id]` mostra a
  confirmação (status `aguardando_pagamento`, sem pagamento real ainda).
- **`/encomendas` + admin/encomendas:** formulário de lead (hero + form,
  conforme `docs/prototipo/Encomendas e Consultoria.dc.html`, lido na
  íntegra — não o resumo do §3) grava em `solicitacoes_encomenda` via
  `POST /api/encomendas`, com o **client de sessão** (não
  `criarClientAdmin()` — não há preço nem nada sensível pra recalcular
  aqui, a policy de INSERT já é pública por desenho). `/admin/encomendas`
  lista as solicitações e deixa mudar o `status` por um `<select>` que
  escreve direto no Supabase pelo client do navegador, apoiado na policy de
  UPDATE (`eh_admin()`) — sem rota de API pra isso. `src/app/admin/layout.tsx`
  (novo) passou a concentrar os dois portões do admin (sessão + `perfis.papel`),
  que antes viviam só em `admin/page.tsx`; toda rota nova em `/admin/*` já
  nasce protegida sem repetir o código (isso não vale pra rota de API — cada
  uma continua se defendendo sozinha, layout não roda pra route handler).

### A construir

Ordem acordada com a artista (site completo antes do lançamento):

1. **Admin → Pedidos** ← prioridade (gerenciar status de `pedidos`; mesmo
   molde da listagem de Encomendas — comparar as duas antes de extrair
   qualquer coisa em comum, não abstrair antes da hora)
2. Admin → listagem/edição de obras (hoje só cadastra; falta editar/despublicar)
3. Frete por região
4. Pagamento (Mercado Pago — Pix + cartão)
5. Minha Conta (dashboard, meus pedidos, endereços, perfil, favoritos —
   nenhuma dessas sub-telas existe hoje; protótipo é `Minha Conta.dc.html`)
6. Gaps de Home e A Artista (ler os `.dc.html` na íntegra antes de construir
   — o texto do handoff §3 é resumo, diverge do protótipo em pontos reais)
7. Refinamentos visuais (estilo do Admin, animações §4, acessibilidade §6
   restante)
8. Deploy (Vercel)

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
- **CTA "Adquirir esta obra" adiciona ao carrinho de verdade** (não é mais
  placeholder pra `/entrar`) — ver entrada de Carrinho/Checkout em §7.
- **Filtros da Galeria seguem o protótipo, não o texto desta seção 3**
  (que diverge do que foi de fato construído): Coleção, Tamanho, Orientação
  e faixa de preço. Sem filtro de técnica nem de disponibilidade.
- **A Home curadoria via `ordem`, não via uma coluna `destaque`.** Hero =
  primeira obra; faixa de destaque = as 3 seguintes. Não criar coluna nova
  só pra "obra em destaque" — reordenar em `ordem` já resolve, e é o mesmo
  campo que a Galeria usa.
- **Retrato da artista e depoimentos na Home são placeholder.** Não há foto
  da artista nem tabela de depoimentos no schema; o bloco "sobre a artista"
  usa um selo tipográfico no lugar da foto, e a prova de confiança tem um
  depoimento de exemplo, comentado no código como texto a trocar. Trocar
  pelo conteúdo real não é mudança de schema, só de copy/asset.
- **`/colecoes/[serie]` é a URL canônica de uma série**, não
  `/galeria?serie=...`. A Home, o breadcrumb da Página da Obra e o CTA "ver
  obras semelhantes" linkam todos pra `/colecoes/[serie]`. `/galeria?serie=`
  continua funcionando (é assim que `GaleriaInterativa` lê o filtro inicial),
  mas não é mais o link que o resto do site gera.
- **Preço do pedido nunca vem do navegador.** O carrinho (client-side) só
  guarda um preço em cache pra exibição. `POST /api/pedidos` relê
  `tamanhos.preco_centavos`/`disponivel` no momento da confirmação, com o
  client de sessão (mesma policy pública que `/galeria` já usa pra mostrar
  preço — não precisa de service role pra ler). `total_centavos` é sempre
  a soma desse valor recém-lido, nunca do que o cliente mandou.
- **Não existem policies de RLS de INSERT em `pedidos`/`pedido_itens`**, de
  propósito — só SELECT ("cliente vê os seus") e UPDATE (admin muda
  status). A gravação do pedido passa só pela rota, com
  `criarClientAdmin()`, depois que preço/disponibilidade já foram
  conferidos contra o banco. Não escrever policy de INSERT pra "resolver"
  isso — seria abrir a porta pro cliente inserir preço arbitrário.
- **Cadastro de cliente usa o trigger já existente no banco**
  (`handle_novo_usuario()`, disparado por `on_auth_user_created`): insere em
  `perfis` a partir de `raw_user_meta_data->>'nome'`, com `papel` default
  `'cliente'`. O front só precisa mandar `options.data.nome` no `signUp()` —
  nada no código da aplicação toca em `perfis` diretamente.
- **Login só é exigido em `/finalizar-pedido`**, nunca pra montar o
  carrinho. Rota sem sessão redireciona pra `/entrar?next=/finalizar-pedido`
  e volta sozinha depois do login/cadastro.
- **Forma do `endereco_entrega` (jsonb):** `{ cep, logradouro, numero,
  complemento, bairro, cidade, estado }` — `complemento` é o único opcional.
- **Carrinho é um módulo singleton com `useSyncExternalStore`, não Context.**
  `src/components/carrinho/ContextoCarrinho.tsx` guarda o estado fora do
  React (só faz sentido um carrinho por navegador) e sincroniza com
  `localStorage`. Tentativa anterior com `useState` + `useEffect` pra
  hidratar do `localStorage` dispara o lint novo do React
  (`react-hooks/set-state-in-effect`, "cascading renders"); `getServerSnapshot`
  **precisa** devolver sempre a mesma referência (`ARRAY_VAZIO` do módulo),
  senão o React entra em loop.
- **`/api/obras` e `/api/pedidos` precisam de `SUPABASE_SERVICE_ROLE_KEY`
  no `.env.local`** (as duas rotas que usam `criarClientAdmin()`) — sem ela,
  lançam em dev local. Fluxo de carrinho → cadastro → pedido → confirmação
  testado ponta a ponta contra o banco de verdade depois de a chave ser
  adicionada.
- **Princípio novo, vale pra todo o projeto daqui pra frente: conteúdo
  institucional deve ser editável pela artista no admin, não hardcoded no
  `.tsx`.** Ela opera o site sozinha — não pode depender de mim pra trocar
  um texto ou uma foto. Não é tudo-ou-nada: decide-se caso a caso, com o
  critério "o que ela mexe com frequência justifica o esforço agora; o que
  ela quase nunca mexe pode ficar hardcoded e esperar". Aplicado até aqui:
  as solicitações de encomenda viram linha no banco (é o propósito da
  tela); a copy estrutural de `/encomendas` (headline, bullets, textos de
  seção) fica hardcoded por ora; a foto do hero fica placeholder até a
  tarefa "gaps de Home e A Artista" resolver as imagens editáveis das três
  telas de uma vez, em vez de construir um mecanismo por imagem.
- **Nem toda escrita de admin precisa de `criarClientAdmin()`.** O
  `<select>` de status em `/admin/encomendas` escreve direto do navegador
  (client de sessão) porque a policy de UPDATE (`eh_admin()`) já é a
  fronteira de segurança suficiente ali — é uma ação de admin autenticado
  sobre um dado que não tem preço nem nada equivalente pra proteger.
  Service role continua reservado pra quando a RLS sozinha não resolve
  (ex.: gravar `pedidos`, que não tem policy de INSERT de propósito).
- **`solicitacoes_encomenda` é tabela própria, não reaproveita `pedidos`.**
  "Encomenda" já é termo usado no site pra impressão feita sob encomenda
  (qualquer obra); esta tabela é sobre pedidos de **orçamento/consultoria**
  antes de existir venda. RLS: INSERT público (`with check (status =
  'nova')`, ninguém nasce com outro status), SELECT e UPDATE só admin via
  `eh_admin()`.
- **Login sem `?next=` manda admin pra `/admin`, e todo mundo mais pra `/`.**
  O ícone de conta do Cabeçalho não sabe se quem vai clicar é a artista ou
  uma cliente — não manda `next` nenhum. Sem essa checagem em `/entrar`
  (`redirecionarAposEntrar` em `src/app/entrar/page.tsx`), logar como admin
  por ali caía sempre na Home, sem indicação nenhuma de que o login
  funcionou (não existe estado "logada" visível no Cabeçalho — decisão já
  registrada). `?next=` explícito (ex.: `/finalizar-pedido`) sempre vence
  essa checagem. Rodapé ganhou um link discreto "Painel administrativo" →
  `/admin` (igual ao protótipo), pra existir *algum* caminho clicável até
  lá — antes só dava digitando a URL.

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
