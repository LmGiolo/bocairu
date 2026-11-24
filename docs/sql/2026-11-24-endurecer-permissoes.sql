-- Endurecimento de permissões, depois da auditoria de segurança de 2026-11-24.
--
-- Rode no SQL Editor do Supabase. Idempotente: pode rodar de novo.
--
-- Nada aqui muda o que o visitante vê nem o que a artista faz no admin:
-- só fecha portas que o site não usa.

-- ─────────────────────────────────────────────────────────────
-- 1) BUCKET obras-web: ninguém de fora LISTA os arquivos
-- ─────────────────────────────────────────────────────────────
-- A policy "web: leitura pública" deixava qualquer pessoa, com a chave anon
-- (que é pública), pedir a lista de TODOS os arquivos do bucket — inclusive
-- a versão web de fotos em rascunho ou arquivadas, que o site não mostra.
--
-- Ela não era necessária para as fotos abrirem: bucket público serve as
-- URLs /storage/v1/object/public/... sem passar pelo RLS. Listar e baixar
-- pela API autenticada é que dependem desta policy, e isso agora só a
-- admin faz. (As rotas do servidor usam service role, que ignora RLS.)
drop policy if exists "web: leitura pública" on storage.objects;
drop policy if exists "web: só admin lê" on storage.objects;
create policy "web: só admin lê" on storage.objects
  for select using (bucket_id = 'obras-web' and eh_admin());

-- ─────────────────────────────────────────────────────────────
-- 2) ENCOMENDAS: fecha a porta também pela policy
-- ─────────────────────────────────────────────────────────────
-- 2026-11-22-portfolio.sql já tirou o INSERT de anon/authenticated por
-- GRANT. A policy de INSERT público continuava lá; sem ela, a porta fica
-- fechada pelos dois lados (um GRANT devolvido por engano não a reabre).
drop policy if exists solicitacoes_encomenda_insert_publico on solicitacoes_encomenda;

-- ─────────────────────────────────────────────────────────────
-- 3) PERFIS: só o necessário
-- ─────────────────────────────────────────────────────────────
-- `perfis.papel` é o que diz quem é admin, então esta tabela merece o
-- menor número possível de portas.
--
-- Já estava seguro: não há policy de INSERT nem de DELETE, e o UPDATE só
-- vale para (nome, telefone) — ver 2026-10-13-minha-conta.sql. Mas os
-- GRANTs padrão do Supabase davam INSERT e DELETE a anon e authenticated,
-- e uma policy criada por descuido no futuro abriria um caminho para
-- alguém apagar o próprio perfil e recriá-lo com papel 'admin'. Como o
-- navegador nunca insere nem apaga perfil (a linha nasce junto com o
-- usuário, pelo Auth), tirar esses direitos não quebra nada.
--
-- SELECT continua para `authenticated`: o /entrar e o layout do admin
-- leem o papel do próprio usuário. O visitante anônimo não lê perfis.
-- (A eh_admin() é SECURITY DEFINER: lê perfis como dona da tabela, então
-- este revoke não a afeta.)
revoke insert, delete, truncate, references, trigger on perfis from anon, authenticated;
revoke select on perfis from anon;

-- Duas policies de UPDATE faziam a mesma coisa; fica a que está no repositório
-- (perfis_update_proprio, de 2026-10-13-minha-conta.sql).
drop policy if exists "perfil: cada um edita o seu" on perfis;

-- ─────────────────────────────────────────────────────────────
-- ⚠ NÃO revogue EXECUTE da eh_admin() para anon
-- ─────────────────────────────────────────────────────────────
-- Parece uma boa ideia (a função vira /rest/v1/rpc/eh_admin), mas as
-- policies de `obras` a chamam também para o visitante anônimo
-- ("status = 'publicada' OR eh_admin()"). Sem EXECUTE, toda leitura de
-- obras pelo site dá "permission denied for function eh_admin" — testado
-- em produção em 2026-11-24, por engano. Chamá-la por RPC não vaza nada:
-- ela só responde se QUEM CHAMOU é admin. Se algum dia for revogada,
-- desfaça com:
--
--   grant execute on function eh_admin() to anon, authenticated;
