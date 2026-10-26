-- Inspeção de catálogos, sem linhas de usuários/eventos e sem DDL.
-- O workflow também força default_transaction_read_only e confere o projeto alvo.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
begin transaction read only;
set local statement_timeout = '5s';
set local lock_timeout = '1s';
set local idle_in_transaction_session_timeout = '15s';

select 'MEASUREMENT_CONTRACT_JSON=' || jsonb_build_object(
  'transactionReadOnly', current_setting('transaction_read_only'),
  'serverVersion', current_setting('server_version'),
  'tables', coalesce((select jsonb_agg(jsonb_build_object(
    'name', c.relname, 'rlsEnabled', c.relrowsecurity, 'rlsForced', c.relforcerowsecurity
  ) order by c.relname) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('eventos','cliques','usuarios','scrape_jobs') and c.relkind = 'r'), '[]'::jsonb),
  'constraints', coalesce((select jsonb_agg(jsonb_build_object(
    'table', c.relname, 'name', k.conname, 'type', k.contype,
    'definition', case when pg_get_constraintdef(k.oid) ~* '(https?://|@|password|secret|token)' then '[sensitive-expression-omitted]' else pg_get_constraintdef(k.oid) end
  ) order by c.relname, k.conname) from pg_constraint k join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('eventos','cliques','usuarios','scrape_jobs')), '[]'::jsonb),
  'policies', coalesce((select jsonb_agg(jsonb_build_object(
    'table', tablename, 'name', policyname, 'permissive', permissive, 'roles', roles, 'command', cmd,
    'using', case when qual ~* '(https?://|@|password|secret|token)' then '[sensitive-expression-omitted]' else qual end,
    'check', case when with_check ~* '(https?://|@|password|secret|token)' then '[sensitive-expression-omitted]' else with_check end
  ) order by tablename, policyname) from pg_policies where schemaname = 'public' and tablename in ('eventos','cliques','usuarios','scrape_jobs')), '[]'::jsonb),
  'columnGrants', coalesce((select jsonb_agg(jsonb_build_object(
    'table', table_name, 'role', grantee, 'column', column_name, 'privilege', privilege_type
  ) order by table_name, grantee, column_name, privilege_type) from information_schema.column_privileges
    where table_schema = 'public' and table_name in ('eventos','cliques','usuarios','scrape_jobs') and grantee in ('anon','authenticated','service_role')), '[]'::jsonb),
  'triggers', coalesce((select jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'table', c.relname, 'name', t.tgname, 'functionSchema', fn.nspname, 'function', p.proname,
    'securityDefiner', p.prosecdef, 'roleMentionedInFunction', position('role' in lower(p.prosrc)) > 0
  ) order by n.nspname, c.relname, t.tgname) from pg_trigger t join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace join pg_proc p on p.oid = t.tgfoid join pg_namespace fn on fn.oid = p.pronamespace
    where not t.tgisinternal and ((n.nspname = 'public' and c.relname = 'usuarios') or (n.nspname = 'auth' and c.relname = 'users'))), '[]'::jsonb)
)::text;
rollback;
