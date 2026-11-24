# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Site-portfólio de fotografia de uma artista. Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage).

**Vendas em standby (desde 2026-11-22):** o site é só portfólio — o visitante vê as fotos e fala com a artista pelo WhatsApp/Instagram (`src/lib/contato.ts`) para agendar sessões ou negociar a compra de uma foto (a negociação é fora do site). Não há carrinho, checkout, tamanhos, preços nem contas de visitante; só a artista faz login (admin). Todo o código da loja está na tag git `loja-v1`; como retomar está em docs/handoff.md ("Vendas em standby").

A especificação de design e o estado do projeto estão em docs/handoff.md; consulte antes de construir telas. **O plano do que falta fazer (com especificação) está em docs/handoff.md §7 → "A construir"** — comece pelo bloco "📍 ONDE PARAMOS" dele ao retomar o trabalho.

Em decisões visuais, o usuário prefere **seguir o Design Doc e os protótipos** (`docs/prototipo/*.dc.html`) a propostas alternativas — duas linhas de animação "diferentes" foram testadas e recusadas.

Commits e PRs deste repositório **não levam atribuição de IA** (nada de `Co-Authored-By: Claude` nem "Generated with Claude Code").

## Comandos

```bash
npm run dev     # servidor de desenvolvimento em http://localhost:3000
npm run build   # build de produção (é aqui que erros de tipo aparecem — tsc roda com noEmit)
npm run start   # serve o build de produção
npm run lint    # eslint (flat config: eslint-config-next core-web-vitals + typescript)
```

Não há setup de testes no repositório.

**Não rode `npm run build` com o `npm run dev` do usuário aberto**: já deixou o dev servindo uma versão velha das páginas (404 em todas as obras). Para checar tipos nesse caso, `npx tsc --noEmit`; o CI roda lint + build em todo PR.

## Animações do site público

Componentes não têm lógica de animação, só ganchos: `data-anim="secao|foto|capa"` e classes `anim-*`, `cabecalho`, `barra-filtros`, `botao-*`. O `ObservadorAnimacoes` (montado no layout do site) marca `data-visivel` quando o elemento entra na tela e `data-rolou` no `<html>` ao rolar; o CSS de tudo está no bloco "ANIMAÇÕES" de `src/app/globals.css`. A passagem da foto entre cartão e Página da Obra é `<ViewTransition name="foto-<id>">` do React (sem flag desde o Next 16.3; a antiga `experimental.viewTransition` foi removida); os tipos vêm de `src/types/react-canary.d.ts`.

## Stack e convenções de configuração

React 19, TypeScript strict, Tailwind CSS v4, `@supabase/ssr`.

Tailwind v4 é configurado no CSS, não em JS: `@import "tailwindcss"` mais o bloco `@theme inline` em `src/app/globals.css`, ligado pelo `@tailwindcss/postcss`. **Não existe `tailwind.config.*`** — tokens de design vão no bloco `@theme`.

Alias de import: `@/*` → `./src/*`.

Variáveis em `.env.local` (fora do git): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (esta última só no servidor — veja abaixo).

## Os quatro clients do Supabase

Nunca são intercambiáveis:

- `src/lib/supabase/publico.ts` — `criarClientPublico()`, síncrono, **sem cookies**: sempre o visitante anônimo. É o client de **todo o site público** (páginas de `(site)`, `lerConteudoSite`, `opengraph-image`). Sem cookies a página pode ficar em cache (ver "Cache do site público").
- `src/lib/supabase/server.ts` — `createClient()` é **async** (faz `await cookies()`). Use no admin, em `/entrar` e em Route Handlers/Server Actions. Sempre `await createClient()`.
- `src/lib/supabase/client.ts` — client síncrono do navegador, para componentes `'use client'`.
- `src/lib/supabase/admin.ts` — `criarClientAdmin()`, service role, **só no servidor**. Detalhado em "Upload em dois buckets".

Nos três primeiros a chave é a anon e **a fronteira de segurança real é o RLS do Supabase**, não o código do app. No último isso se inverte.

## Cache do site público

As páginas de `src/app/(site)` e as `opengraph-image` são ISR: montadas uma vez e servidas prontas (`revalidate = 3600` no layout do site; rotas com `[parâmetro]` têm `generateStaticParams` vazio para entrar no cache na primeira visita). O `npm run build` mostra isso na tabela de rotas: nenhuma rota pública pode aparecer como `ƒ (Dynamic)`.

- **Não use `cookies()`, `headers()` nem `searchParams` em página pública**: qualquer um deles tira a página do cache sem avisar. (Por isso a Galeria não lê `?serie=`, que virou redirect para `/colecoes/X` no `next.config.ts`, e o link da foto no WhatsApp vem de `urlDoSite()`.)
- **Toda gravação do admin que muda o site invalida o cache**: rotas de API chamam `revalidarSitePublico()` (`src/lib/cache-site.ts`); componentes que gravam pelo client do navegador chamam a Server Action `atualizarSitePublico()` (`src/app/admin/acoes.ts`, com os dois portões) depois de salvar. Gravação nova esquecida aqui = site desatualizado por até uma hora.
- Erro de banco em página pública é **lançado** (`throw`), não desenhado: assim o ISR mantém a versão anterior em vez de guardar uma página de erro.
- Consequência do client anônimo: a artista logada vê no site o mesmo que o visitante (rascunho só no admin).

## Autenticação e autorização

Não existe `middleware.ts`: a sessão não é renovada a cada navegação e não há proteção de rota centralizada. Cada página protegida se defende sozinha.

`src/app/admin/layout.tsx` concentra dois portões para todo `/admin/*` (rota de API não passa por layout — cada uma refaz os portões):

1. `supabase.auth.getUser()` → `redirect('/entrar')` se não houver usuário;
2. `perfis.papel !== 'admin'` → `redirect('/entrar')`.

Esses redirects são só UX. Ao criar qualquer superfície nova de admin, ajuste as policies de RLS junto.

`/entrar` faz `signInWithPassword` e empurra para `/admin`; conta que não é admin é deslogada na hora. Não existe cadastro: o modo "Criar conta" foi removido e o signup está **desligado no painel do Supabase** (sem isso, `signUp()` continuaria chamável pela API com a chave anon pública).

## Modelo de dados (vive no Supabase, não neste repositório)

- `obras` — `id`, `titulo`, `ano`, `descricao`, `status` (a galeria espera `'publicada'`), `ordem` (posição no site: 1 = capa da Home, 2–4 = destaques, a Galeria segue a mesma sequência; editada em `/admin/ordem`; desempate por `criado_em`), `imagem_web` (URL pública), `imagem_alta` (caminho no bucket privado).
- `tamanhos`, `fretes`, `pedidos`, `pedido_itens`, `enderecos`, `favoritos`, `solicitacoes_encomenda` — tabelas da loja, **sem uso enquanto as vendas estão em standby**. Continuam no banco, protegidas por RLS (schema em `docs/sql/`).
- `perfis` — uma linha por usuário do auth: `id` (= `auth.users.id`), `papel` (`'admin'`).
- Bucket `obras-web` (público) — arquivos são nomeados `${Date.now()}-${arquivo.name}` e lidos de volta com `getPublicUrl`.

`/galeria` faz `select('*')` em `obras` **sem filtrar por status**: ela depende do RLS para devolver só as obras publicadas a visitantes anônimos. Não "conserte" isso adicionando filtro no código sem antes conferir a policy.

## Upload em dois buckets

`POST /api/obras` (`src/app/api/obras/route.ts`) é o caminho de cadastro de obra. O formulário (`src/components/admin/FormularioObra.tsx`) valida os campos, envia a foto e entrega os campos à rota; todo o resto é servidor.

**O arquivo nunca passa pela rota** (envio direto, `src/lib/envios/`). Funções serverless recusam requisição acima de ~4,5 MB, então:

1. o navegador pede `POST /api/envios` (dois portões) e recebe caminho + token de uma URL de envio assinada, numa pasta de passagem `envios/` do bucket privado `obras-alta`. **Quem escolhe o caminho é o servidor**;
2. o navegador sobe o arquivo direto para o Storage (`enviarDireto()`, `uploadToSignedUrl`);
3. a rota recebe só o caminho (campo `envio`), confere o formato com `ehCaminhoEnvio()` (caminho de fora de `envios/` é recusado: senão daria para apontar para o original de outra obra) e baixa o arquivo com `baixarEnvio()`, que confere o tamanho real.

A partir daí, na rota:

1. `sharp` gera a versão web (maior lado 2000px, webp q82, `.rotate()` para honrar o EXIF) — **sem marca d'água**;
2. a versão web vai para o bucket público `obras-web`; o original é **movido** de `envios/` para o lugar definitivo em `obras-alta`;
3. a obra guarda a URL pública em `imagem_web` e o **caminho** (não URL) em `imagem_alta`.

O retrato (`POST /api/textos/retrato`) usa o mesmo envio direto; lá o arquivo de `envios/` é sempre apagado no fim (só o webp fica). Rotas novas de admin usam os portões de `src/lib/conferir-admin.ts`.

**Versão do `sharp`:** a do `package.json` tem de ser a mesma que o `next` pede (hoje `^0.35.5`; confira com `npm ls sharp`, que deve mostrar `deduped`). Com duas versões instaladas, o otimizador do `next/image` e o nosso código carregam libvips diferentes no mesmo processo; a segunda quebra e o Next passa a servir a foto original sem reduzir, sem erro nenhum na tela. Ao atualizar o Next, alinhe o `sharp` junto.

### Consistência: a pilha de desfazer

A rota grava em **dois sistemas** (Storage e Postgres) e o Supabase não oferece transação que abrace os dois. O padrão adotado é compensação: cada gravação bem-sucedida empilha em `desfazer` a ação que a reverte, e qualquer falha posterior chama `reverterTudo()`, que executa a pilha de trás para frente. A pilha já começa com "apagar o arquivo de `envios/`". Falhou o insert da obra → as duas imagens somem dos buckets.

**Validação antes de efeito colateral.** O formulário roda `validarFormularioObra()` **antes** de enviar a foto, e a rota valida de novo antes de `sharp` e de qualquer gravação. Como a foto já está em `envios/` quando a rota roda, toda recusa da rota apaga esse arquivo antes de responder (`recusar()`).

**O limite honesto:** isto não é uma transação. Se o processo morrer entre um upload e o insert da obra, a compensação não roda e sobra um arquivo órfão no bucket (lixo, não dado errado). O mesmo vale para envio abandonado (foto subiu, a aba fechou antes da rota): fica em `obras-alta/envios/`, onde é fácil achar e apagar.

Foto nova entra no **fim** da ordem do site (`ordem` = maior + 1).

`obras-alta` é privado: **nunca** use `getPublicUrl` nele — o link não abre. O acesso é por signed URL gerada na hora ou só pelo servidor.

### O client de service role

`src/lib/supabase/admin.ts` é o terceiro client, e o único que ignora RLS. Regras que não se negociam:

- a chave mora em `SUPABASE_SERVICE_ROLE_KEY`, **sem** o prefixo `NEXT_PUBLIC_` — só variáveis com esse prefixo são embutidas no bundle do navegador;
- o módulo importa `server-only`, então o build quebra se um componente `'use client'` o importar;
- **com service role não existe rede de proteção**: toda autorização vira responsabilidade do nosso código.

Por isso a rota tem dois portões antes de tocar no arquivo, e a ordem importa:

1. **identidade** — `supabase.auth.getUser()` no client de sessão (chave anon). `getUser()` valida o token contra o servidor de Auth; `getSession()` só lê o cookie e acredita, então não serve como portão;
2. **papel** — `perfis.papel` lido **com o client de service role**, filtrando por `user.id` vindo do token verificado. Ler o papel com a chave anon passaria pelo RLS, ou seja, o resultado dependeria da policy; com service role a resposta vem direto da tabela.

A checagem de `perfis.papel` da página `/admin` não protege rota de API nenhuma — cada rota nova refaz esses dois portões.

## Contato

`src/lib/contato.ts` é o único lugar com o número do WhatsApp e o Instagram, e quem monta os links do wa.me (`whatsAppUrlGeral`, `whatsAppUrlSobreFoto`). O **texto** das mensagens prontas é editável pela artista em `/admin/textos` (chaves `whatsapp.*`).

## Textos do site

Os textos da Home, A Artista e Contato, as mensagens do WhatsApp e os retratos da artista (um por página: `retrato_home`, `retrato_artista`, `retrato_contato`) vêm da tabela `textos_site` (schema em `docs/sql/2026-11-23-textos-site.sql`), editada em `/admin/textos`. O catálogo das chaves, com o texto padrão de cada uma, é `src/lib/textos.ts`: chave sem linha no banco mostra o padrão, então o site nunca fica em branco. Nas páginas, leia com `lerConteudoSite()` (`src/lib/textos-servidor.ts`, embrulhado em `cache()` do React: cabeçalho, rodapé e página consultam o banco uma vez só por visita). Texto multilinha passa por `paragrafos()` (linha em branco = novo parágrafo). Rótulos de botão, filtro e menu **não** entram no catálogo: são interface, não a voz da artista. Os retratos sobem por `POST /api/textos/retrato` com `local` = `home`|`artista`|`contato` (dois portões, sharp → webp, bucket `obras-web`, pasta `site/`).

## Dinheiro (quando as vendas voltarem)

Preços são **sempre inteiros em centavos** (`preco_centavos`), nunca reais com decimal. A conversão `precoParaCentavos()` (na tag `loja-v1`, em `src/lib/obras/formulario.ts`) soma inteiros (`"19" * 100 + "99"`) em vez de multiplicar float, porque `parseFloat('19.99') * 100` dá `1998.9999999999998` em JavaScript.

## Idioma

O domínio inteiro é em português do Brasil: rotas (`/entrar`, `/galeria`, `/admin`), tabelas, colunas, nomes de componentes e variáveis, textos de interface e comentários. Escreva código novo na mesma língua, sem misturar identificadores em inglês.

Os comentários do repositório têm registro explicativo, quase didático (o autor está aprendendo a stack). Mantenha esse tom.

Site público e admin usam Tailwind com os tokens do `@theme` (sem `style={{}}` inline). No admin, telas novas usam `CabecalhoPagina`, `Aviso` e as classes de `src/components/admin/estilos.ts`, e entram no menu pela lista `ITENS` de `BarraLateral.tsx`.

Foto vinda do bucket passa sempre por `next/image`, também no admin (miniatura 40×40: `src/components/admin/Miniatura.tsx`). Um `<img>` direto baixa a versão de 2000px inteira. A única exceção é a prévia local (`blob:`) do upload.
