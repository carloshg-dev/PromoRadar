-- PROPOSTA PARA REVISÃO. Não aplicada no banco remoto em 31/10/2026.
-- Consumidores atuais usam createAdminClient/service_role no servidor.
-- Validar em banco isolado e aprovar a DDL antes de executar em produção.
-- Após aplicação: anon/authenticated não leem rascunhos; pipeline/admin com
-- service_role continuam funcionando. Não apaga nem altera campanhas.
\set ON_ERROR_STOP on
begin;
set local statement_timeout = '5s';
set local lock_timeout = '1s';
alter table public.campanhas enable row level security;
drop policy if exists campanhas_leitura_publica on public.campanhas;
drop policy if exists campanhas_clientes_sem_acesso on public.campanhas;
create policy campanhas_clientes_sem_acesso on public.campanhas
  as restrictive for all to anon, authenticated
  using (false) with check (false);
commit;
