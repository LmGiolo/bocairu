# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Site-portfólio de fotografia de uma artista. Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage).

**Vendas em standby (desde 2026-11-22):** o site é só portfólio — o visitante vê as fotos e fala com a artista pelo WhatsApp/Instagram (`src/lib/contato.ts`) para agendar sessões ou negociar a compra de uma foto (a negociação é fora do site). Não há carrinho, checkout, tamanhos, preços nem contas de visitante; só a artista faz login (admin). Todo o código da loja está na tag git `loja-v1`; como retomar está em docs/handoff.md ("Vendas em standby").

A especificação de design e o estado do projeto estão em docs/handoff.md; consulte antes de construir telas. **O plano do que falta fazer (com especificação) está em docs/handoff.md §7 → "A construir"** — comece por ele ao retomar o trabalho.

Commits e PRs deste repositório **não levam atribuição de IA** (nada de `Co-Authored-By: Claude` nem "Generated with Claude Code").

## Comandos

```bash
npm run dev     # servidor de desenvolvimento em http://localhost:3000
npm run build   # build de produção (é aqui que erros de tipo aparecem — tsc roda com noEmit)
npm run start   # serve o build de produção
npm run lint    # eslint (flat config: eslint-config-next core-web-vitals + typescript)
```

Não há setup de testes no repositório.

## Stack e convenções de configuração

React 19, TypeScript strict, Tailwind CSS v4, `@supabase/ssr`.

Tailwind v4 é configurado no CSS, não em JS: `@import "tailwindcss"` mais o bloco `@theme inline` em `src/app/globals.css`, ligado pelo `@tailwindcss/postcss`. **Não existe `tailwind.config.*`** — tokens de design vão no bloco `@theme`.

Alias de import: `@/*` → `./src/*`.

Variáveis em `.env.local` (fora do git): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (esta última só no servidor — veja abaixo).

## Os três clients do Supabase

Nunca são intercambiáveis:

- `src/lib/supabase/server.ts` — `createClient()` é **async** (faz `await cookies()`). Use em Server Components e Route Handlers. Sempre `await createClient()`.
- `src/lib/supabase/client.ts` — client síncrono do navegador, para componentes `'use client'`.
- `src/lib/supabase/admin.ts` — `criarClientAdmin()`, service role, **só no servidor**. Detalhado em "Upload em dois buckets".

Nos dois primeiros a chave é a anon e **a fronteira de segurança real é o RLS do Supabase**, não o código do app. No terceiro isso se inverte.

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

`POST /api/obras` (`src/app/api/obras/route.ts`) é o caminho de cadastro de obra. O formulário (`src/components/admin/FormularioObra.tsx`) só monta um `FormData` e entrega; todo o resto é servidor:

1. `sharp` gera a versão web (maior lado 2000px, webp q82, `.rotate()` para honrar o EXIF) — **sem marca d'água**;
2. a versão web vai para o bucket público `obras-web`, o original para o bucket privado `obras-alta`;
3. a obra guarda a URL pública em `imagem_web` e o **caminho** (não URL) em `imagem_alta`.

### Consistência: a pilha de desfazer

A rota grava em **dois sistemas** (Storage e Postgres) e o Supabase não oferece transação que abrace os dois. O padrão adotado é compensação: cada gravação bem-sucedida empilha em `desfazer` a ação que a reverte, e qualquer falha posterior chama `reverterTudo()`, que executa a pilha de trás para frente. Falhou o insert da obra → as duas imagens somem dos buckets.

**Validação antes de efeito colateral.** Título, ano e ficha são validados no topo da rota, antes de `sharp` e antes de qualquer upload. Campo malformado nunca chega a sujar bucket.

**O limite honesto:** isto não é uma transação. Se o processo morrer entre um upload e o insert da obra, a compensação não roda e sobra um arquivo órfão no bucket (lixo, não dado errado).

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

`src/lib/contato.ts` é o único lugar com o número do WhatsApp, o Instagram e o texto das mensagens prontas (geral, sobre sessão de fotos; e "sobre esta foto", interesse em comprar, com título + link). Trocar número ou mensagem é mexer só ali.

## Dinheiro (quando as vendas voltarem)

Preços são **sempre inteiros em centavos** (`preco_centavos`), nunca reais com decimal. A conversão `precoParaCentavos()` (na tag `loja-v1`, em `src/lib/obras/formulario.ts`) soma inteiros (`"19" * 100 + "99"`) em vez de multiplicar float, porque `parseFloat('19.99') * 100` dá `1998.9999999999998` em JavaScript.

## Idioma

O domínio inteiro é em português do Brasil: rotas (`/entrar`, `/galeria`, `/admin`), tabelas, colunas, nomes de componentes e variáveis, textos de interface e comentários. Escreva código novo na mesma língua, sem misturar identificadores em inglês.

Os comentários do repositório têm registro explicativo, quase didático (o autor está aprendendo a stack). Mantenha esse tom.

O site público usa Tailwind com os tokens do `@theme`; parte do admin (formulário de obra, listagem) ainda usa `style={{}}` inline.
