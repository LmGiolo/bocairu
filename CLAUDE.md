# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Site de galeria de fotografia de uma artista. Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage).

A especificação de design e o estado do projeto estão em docs/handoff.md; consulte antes de construir telas.

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

`src/app/admin/page.tsx` é o padrão a seguir — dois portões dentro do Server Component:

1. `supabase.auth.getUser()` → `redirect('/entrar')` se não houver usuário;
2. `perfis.papel !== 'admin'` → `redirect('/entrar')`.

Esses redirects são só UX. Ao criar qualquer superfície nova de admin, ajuste as policies de RLS junto.

`/entrar` faz `signInWithPassword` e empurra para `/admin`.

## Modelo de dados (vive no Supabase, não neste repositório)

- `obras` — `id`, `titulo`, `ano`, `descricao`, `status` (a galeria espera `'publicada'`), `ordem` (chave de ordenação), `imagem_web` (URL pública), `imagem_alta` (caminho no bucket privado).
- `tamanhos` — um-para-muitos com `obras`: `id`, `obra_id` (FK com `on delete cascade`), `rotulo` (ex: `'30x40 cm'`), `preco_centavos` (**integer**), `ordem`.
- `perfis` — uma linha por usuário do auth: `id` (= `auth.users.id`), `papel` (`'admin'`).
- Bucket `obras-web` (público) — arquivos são nomeados `${Date.now()}-${arquivo.name}` e lidos de volta com `getPublicUrl`.

`/galeria` faz `select('*')` em `obras` **sem filtrar por status**: ela depende do RLS para devolver só as obras publicadas a visitantes anônimos. Não "conserte" isso adicionando filtro no código sem antes conferir a policy.

## Upload em dois buckets

`POST /api/obras` (`src/app/api/obras/route.ts`) é o caminho de cadastro de obra. O formulário (`src/components/admin/FormularioObra.tsx`) só monta um `FormData` e entrega; todo o resto é servidor:

1. `sharp` gera a versão web (maior lado 2000px, webp q82, `.rotate()` para honrar o EXIF) — **sem marca d'água**;
2. a versão web vai para o bucket público `obras-web`, o original para o bucket privado `obras-alta`;
3. a obra guarda a URL pública em `imagem_web` e o **caminho** (não URL) em `imagem_alta`.

### Consistência: a pilha de desfazer

A rota grava em **dois sistemas** (Storage e Postgres) e o Supabase não oferece transação que abrace os dois. O padrão adotado é compensação: cada gravação bem-sucedida empilha em `desfazer` a ação que a reverte, e qualquer falha posterior chama `reverterTudo()`, que executa a pilha de trás para frente. Falhou o insert de `tamanhos` → a obra é apagada e as duas imagens somem dos buckets.

Duas propriedades que sustentam isso:

- **Validação antes de efeito colateral.** Título, ano e todos os preços são validados no topo da rota, antes de `sharp` e antes de qualquer upload. Preço malformado nunca chega a sujar bucket.
- **Os tamanhos entram num único `insert`** com o array inteiro. Um comando SQL é atômico no Postgres, então não existe estado de "metade dos tamanhos salvos".

**O limite honesto:** isto não é uma transação. Se o processo morrer entre o insert da obra e o dos tamanhos, a compensação não roda e sobra uma obra sem tamanhos. Fechar essa janela exige mover as duas escritas para uma função `plpgsql` chamada via RPC — aí o Postgres cuida da atomicidade de verdade.

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

## Dinheiro

Preços são **sempre inteiros em centavos** (`preco_centavos`), nunca reais com decimal. `precoParaCentavos()` em `src/lib/obras/formulario.ts` é a única conversão: ela soma inteiros (`"19" * 100 + "99"`) em vez de multiplicar float, porque `parseFloat('19.99') * 100` dá `1998.9999999999998` em JavaScript.

`src/lib/obras/formulario.ts` não tem import de servidor de propósito — é puro. O formulário importa `precoParaCentavos` para mostrar o valor formatado enquanto a artista digita, então cliente e servidor interpretam o preço com o mesmo código e não têm como divergir. O servidor revalida tudo assim mesmo; a validação no cliente é conveniência, nunca garantia.

## Idioma

O domínio inteiro é em português do Brasil: rotas (`/entrar`, `/galeria`, `/admin`), tabelas, colunas, nomes de componentes e variáveis, textos de interface e comentários. Escreva código novo na mesma língua, sem misturar identificadores em inglês.

Os comentários do repositório têm registro explicativo, quase didático (o autor está aprendendo a stack). Mantenha esse tom.

Páginas ainda usam `style={{}}` inline; o Tailwind está configurado no `layout.tsx` mas não foi adotado na marcação.
