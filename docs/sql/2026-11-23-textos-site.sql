-- Textos do site editáveis pelo admin (item 3 do plano em docs/handoff.md §7).
--
-- Rode no SQL Editor do Supabase. Idempotente: pode rodar de novo.
--
-- Uma linha por texto: `chave` é o nome do texto (ex.: 'home.capa_frase'),
-- `valor` é o que a artista escreveu. A lista de chaves e o texto padrão de
-- cada uma vivem no código (src/lib/textos.ts), não aqui: chave que não tem
-- linha no banco mostra o texto padrão — o site nunca fica em branco, e a
-- tabela pode começar vazia.
--
-- Os retratos da artista também moram aqui, um por página — chaves
-- 'retrato_home', 'retrato_artista' e 'retrato_contato' (a URL pública do
-- arquivo no bucket obras-web, pasta site/).

create table if not exists textos_site (
  chave text primary key,
  -- Teto generoso (o maior texto, a trajetória, cabe com folga): só
  -- impede alguém de gravar um livro inteiro pela API.
  valor text not null check (char_length(valor) <= 5000),
  atualizado_em timestamptz not null default now()
);

alter table textos_site enable row level security;

-- Leitura pública: são os textos que todo visitante vê.
drop policy if exists textos_site_select_publico on textos_site;
create policy textos_site_select_publico on textos_site
  for select using (true);

-- Escrita só admin. A tela /admin/textos faz upsert (grava a linha se não
-- existe, atualiza se existe), que precisa de INSERT e UPDATE.
drop policy if exists textos_site_insert_admin on textos_site;
create policy textos_site_insert_admin on textos_site
  for insert with check (eh_admin());

drop policy if exists textos_site_update_admin on textos_site;
create policy textos_site_update_admin on textos_site
  for update using (eh_admin()) with check (eh_admin());

-- Sem policy de DELETE de propósito: "voltar ao texto original" grava o
-- texto padrão, não apaga a linha. O retrato removido é apagado pela rota
-- /api/textos/retrato, com service role (que ignora RLS).

-- Avisa a API do Supabase (PostgREST) que existe tabela nova. Ela guarda
-- uma "fotografia" das tabelas (o schema cache) e, até atualizar, responde
-- "Could not find the table 'public.textos_site' in the schema cache".
notify pgrst, 'reload schema';
