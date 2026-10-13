-- Minha Conta: endereços salvos, favoritos e edição do próprio perfil.
--
-- Rode no SQL Editor do Supabase DEPOIS de 2026-10-13-frete.sql. É
-- idempotente: pode rodar de novo sem estragar nada.
--
-- As três telas escrevem direto do navegador (client com chave anon), então
-- a fronteira de segurança é inteira daqui: RLS decide QUAIS linhas, e os
-- GRANTs de coluna decidem QUAIS campos.

-- ─────────────────────────────────────────────────────────────
-- 1) ENDEREÇOS
-- ─────────────────────────────────────────────────────────────
create table if not exists enderecos (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid(): o navegador nem manda o dono, o banco preenche com
  -- quem está logado — e a policy de INSERT confere isso de novo.
  cliente_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  apelido text check (char_length(apelido) <= 60),
  cep text not null check (cep ~ '^[0-9]{8}$'),
  logradouro text not null check (char_length(logradouro) between 1 and 200),
  numero text not null check (char_length(numero) between 1 and 200),
  complemento text check (char_length(complemento) <= 200),
  bairro text not null check (char_length(bairro) between 1 and 200),
  cidade text not null check (char_length(cidade) between 1 and 200),
  estado text not null check (estado ~ '^[A-Z]{2}$'),
  padrao boolean not null default false,
  criado_em timestamptz not null default now()
);

-- No máximo UM endereço padrão por cliente — garantido pelo banco, não só
-- pela tela.
create unique index if not exists enderecos_um_padrao_por_cliente
  on enderecos (cliente_id) where padrao;

alter table enderecos enable row level security;

drop policy if exists enderecos_select_proprio on enderecos;
create policy enderecos_select_proprio on enderecos
  for select using (cliente_id = auth.uid());

drop policy if exists enderecos_insert_proprio on enderecos;
create policy enderecos_insert_proprio on enderecos
  for insert with check (cliente_id = auth.uid());

drop policy if exists enderecos_update_proprio on enderecos;
create policy enderecos_update_proprio on enderecos
  for update using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());

drop policy if exists enderecos_delete_proprio on enderecos;
create policy enderecos_delete_proprio on enderecos
  for delete using (cliente_id = auth.uid());

-- Trocar o endereço padrão são DOIS updates (desmarca o antigo, marca o
-- novo) — feitos do navegador, um poderia passar e o outro não. Dentro de
-- uma função, os dois rodam na mesma transação: ou acontecem juntos ou
-- nenhum acontece. `security invoker` = roda com as permissões de quem
-- chamou, então o RLS acima continua valendo aqui dentro.
create or replace function definir_endereco_padrao(p_endereco_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from enderecos where id = p_endereco_id and cliente_id = auth.uid()
  ) then
    raise exception 'Endereço não encontrado.';
  end if;

  update enderecos set padrao = false where cliente_id = auth.uid() and padrao;
  update enderecos set padrao = true where id = p_endereco_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2) FAVORITOS
-- ─────────────────────────────────────────────────────────────
create table if not exists favoritos (
  cliente_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  obra_id uuid not null references obras (id) on delete cascade,
  criado_em timestamptz not null default now(),
  -- Chave composta: favoritar a mesma obra duas vezes é impossível.
  primary key (cliente_id, obra_id)
);

alter table favoritos enable row level security;

drop policy if exists favoritos_select_proprio on favoritos;
create policy favoritos_select_proprio on favoritos
  for select using (cliente_id = auth.uid());

drop policy if exists favoritos_insert_proprio on favoritos;
create policy favoritos_insert_proprio on favoritos
  for insert with check (cliente_id = auth.uid());

drop policy if exists favoritos_delete_proprio on favoritos;
create policy favoritos_delete_proprio on favoritos
  for delete using (cliente_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3) PERFIL — cliente edita nome e telefone, NUNCA o papel
-- ─────────────────────────────────────────────────────────────
-- Uma policy de UPDATE sozinha liberaria a linha inteira, inclusive
-- `papel` — qualquer cliente poderia se promover a admin pelo console do
-- navegador. Por isso o UPDATE é tirado da tabela toda e devolvido só
-- coluna a coluna: RLS escolhe a linha (só a própria), o GRANT escolhe os
-- campos (só nome e telefone).
drop policy if exists perfis_update_proprio on perfis;
create policy perfis_update_proprio on perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

revoke update on perfis from anon, authenticated;
grant update (nome, telefone) on perfis to authenticated;
