# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Site de galeria de fotografia de uma artista. Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage).

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

Variáveis em `.env.local` (fora do git): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Os dois clients do Supabase

Nunca são intercambiáveis:

- `src/lib/supabase/server.ts` — `createClient()` é **async** (faz `await cookies()`). Use em Server Components e Route Handlers. Sempre `await createClient()`.
- `src/lib/supabase/client.ts` — client síncrono do navegador, para componentes `'use client'`.

Só a chave anon é usada até agora. **A fronteira de segurança real é o RLS do Supabase**, não o código do app.

## Autenticação e autorização

Não existe `middleware.ts`: a sessão não é renovada a cada navegação e não há proteção de rota centralizada. Cada página protegida se defende sozinha.

`src/app/admin/page.tsx` é o padrão a seguir — dois portões dentro do Server Component:

1. `supabase.auth.getUser()` → `redirect('/entrar')` se não houver usuário;
2. `perfis.papel !== 'admin'` → `redirect('/entrar')`.

Esses redirects são só UX. Ao criar qualquer superfície nova de admin, ajuste as policies de RLS junto.

`/entrar` faz `signInWithPassword` e empurra para `/admin`.

## Modelo de dados (vive no Supabase, não neste repositório)

- `obras` — `id`, `titulo`, `ano`, `descricao`, `status` (a galeria espera `'publicada'`), `ordem` (chave de ordenação), `imagem_web` (URL pública).
- `perfis` — uma linha por usuário do auth: `id` (= `auth.users.id`), `papel` (`'admin'`).
- Bucket `obras-web` (público) — arquivos são nomeados `${Date.now()}-${arquivo.name}` e lidos de volta com `getPublicUrl`.

`/galeria` faz `select('*')` em `obras` **sem filtrar por status**: ela depende do RLS para devolver só as obras publicadas a visitantes anônimos. Não "conserte" isso adicionando filtro no código sem antes conferir a policy.

## Direção do projeto: upload em dois buckets

Estado atual: `src/components/admin/UploadTeste.tsx` é andaime de teste. Ele sobe a imagem **original** direto do navegador para o bucket público `obras-web` e cria uma obra com `titulo: 'Obra sem título'` fixo.

Para onde isso vai:

- O upload sai do navegador e passa a ser feito por uma **Route Handler** que recebe o arquivo.
- No servidor, `sharp` gera uma versão web redimensionada e comprimida — **sem marca d'água**, preservando boa qualidade visual.
- A versão web vai para o bucket público `obras-web`; o **original** vai para um bucket privado `obras-alta`.
- A obra guarda os dois caminhos (o público em `imagem_web`, o de alta em uma coluna própria).

Consequências a ter em mente ao mexer nisso: `sharp` ainda não está nas dependências; o bucket `obras-alta` é privado, então nunca use `getPublicUrl` para ele (o acesso é por signed URL ou só pelo servidor); e a rota precisa validar que quem chama é admin — a checagem de `perfis.papel` da página `/admin` não protege a rota de API.

## Idioma

O domínio inteiro é em português do Brasil: rotas (`/entrar`, `/galeria`, `/admin`), tabelas, colunas, nomes de componentes e variáveis, textos de interface e comentários. Escreva código novo na mesma língua, sem misturar identificadores em inglês.

Os comentários do repositório têm registro explicativo, quase didático (o autor está aprendendo a stack). Mantenha esse tom.

Páginas ainda usam `style={{}}` inline; o Tailwind está configurado no `layout.tsx` mas não foi adotado na marcação.
