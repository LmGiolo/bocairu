-- Frete por região × porte — o código já usa isto desde o commit de frete
-- (POST /api/pedidos, /finalizar-pedido, /admin/frete, FormularioObra), mas
-- o schema nunca tinha sido aplicado no banco. Sem este script, finalizar
-- qualquer pedido quebra (a rota lê `tamanhos.porte` e a tabela `fretes`).
--
-- Rode no SQL Editor do Supabase. É idempotente: pode rodar mais de uma
-- vez sem estragar nada (todo create/alter tem "if not exists" ou é
-- precedido de "drop ... if exists").

-- 1) Porte físico da impressão (P/M/G) — chave da tabela de frete.
do $$
begin
  create type tamanho_porte as enum ('P', 'M', 'G');
exception
  when duplicate_object then null;
end $$;

alter table tamanhos
  add column if not exists porte tamanho_porte not null default 'M';

-- 2) Tabela de frete: uma linha por região × porte (15 no total).
--    `regiao` é text de propósito (ver docs/handoff.md §8).
create table if not exists fretes (
  id uuid primary key default gen_random_uuid(),
  regiao text not null,
  porte tamanho_porte not null,
  valor_centavos integer not null check (valor_centavos >= 0),
  atualizado_em timestamptz not null default now(),
  unique (regiao, porte)
);

alter table fretes enable row level security;

-- Leitura pública (dado de vitrine, igual a tamanhos.preco_centavos).
drop policy if exists fretes_select_publico on fretes;
create policy fretes_select_publico on fretes
  for select using (true);

-- Escrita só admin. O /admin/frete faz upsert, que precisa de INSERT e UPDATE.
drop policy if exists fretes_insert_admin on fretes;
create policy fretes_insert_admin on fretes
  for insert with check (eh_admin());

drop policy if exists fretes_update_admin on fretes;
create policy fretes_update_admin on fretes
  for update using (eh_admin()) with check (eh_admin());

-- 3) Valor do frete gravado no pedido (total_centavos = obras + frete).
alter table pedidos
  add column if not exists frete_centavos integer not null default 0
  check (frete_centavos >= 0);
