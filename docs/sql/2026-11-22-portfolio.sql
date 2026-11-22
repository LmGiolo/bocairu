-- Site virou portfólio (vendas em standby — ver docs/handoff.md).
--
-- Rode no SQL Editor do Supabase. Idempotente: pode rodar de novo.
--
-- O formulário de /encomendas saiu do site, mas a tabela continua com
-- INSERT público (era de propósito: qualquer visitante deixava um lead).
-- Sem o formulário, essa porta só serve pra robô de spam gravar lixo
-- direto pela API REST com a chave anon, que é pública. `revoke` tira o
-- direito de inserir de quem não é service role, seja qual for o nome da
-- policy — as linhas antigas continuam lá, intactas.
revoke insert on solicitacoes_encomenda from anon, authenticated;

-- Pedidos, endereços, favoritos e fretes NÃO precisam de nada: nenhum
-- deles tem INSERT liberado pra anon, e as leituras já são só do dono ou
-- do admin (ver docs/sql/2026-10-13-*.sql). As tabelas ficam no banco,
-- vazias de uso, prontas pra quando as vendas voltarem.
