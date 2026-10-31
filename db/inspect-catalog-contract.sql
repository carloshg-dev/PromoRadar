-- Apenas schema, índices e plano estimado: sem linhas, ANALYZE, DDL ou escrita.
-- O workflow força read-only e confirma o projeto antes de conectar.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
begin transaction read only;
set local statement_timeout = '5s';
set local lock_timeout = '1s';
set local idle_in_transaction_session_timeout = '15s';

select 'CATALOG_CONTRACT_JSON=' || jsonb_build_object(
  'transactionReadOnly', current_setting('transaction_read_only'),
  'databaseBytes', pg_database_size(current_database()),
  'tableBytes', (select jsonb_agg(jsonb_build_object('table', c.relname, 'totalBytes', pg_total_relation_size(c.oid)))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('produtos','lojas','categorias','historico_precos')),
  'view', (select jsonb_build_object('options', c.reloptions, 'definition',
    case when pg_get_viewdef(c.oid, true) ~* '(https?://|@|password|secret|token)'
      then '[sensitive-expression-omitted]' else pg_get_viewdef(c.oid, true) end)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='vw_ofertas'),
  'columns', (select jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name, 'type', data_type))
    from information_schema.columns where table_schema='public'
      and table_name in ('produtos','lojas','categorias','vw_ofertas')),
  'indexes', (select jsonb_agg(jsonb_build_object('table', tablename, 'name', indexname, 'definition',
    case when indexdef ~* '(https?://|@|password|secret|token)' then '[sensitive-expression-omitted]' else indexdef end))
    from pg_indexes where schemaname='public' and tablename in ('produtos','lojas','categorias','historico_precos')),
  'foreignKeys', (select jsonb_agg(jsonb_build_object('table', c.relname, 'definition', pg_get_constraintdef(k.oid)))
    from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('produtos','lojas','categorias') and k.contype='f'),
  'approximateRows', (select jsonb_agg(jsonb_build_object('table', c.relname, 'estimate', c.reltuples))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('produtos','lojas','categorias','historico_precos'))
)::text;

set local role anon;
\echo CATALOG_PLAN_START
explain (format json)
select id, titulo, imagem_url, preco_atual, promo_score, atualizado_em
from public.vw_ofertas
where em_estoque=true and preco_atual > 0 and preco_atual <= 1000
  and atualizado_em >= now() - interval '7 days' and atualizado_em <= now()
  and loja_slug not in ('aliexpress') and imagem_url is not null
  and imagem_url not ilike '%noimage%' and imagem_url not ilike '%placeholder%'
order by promo_score desc nulls last, atualizado_em desc, id asc limit 60;
\echo CATALOG_PLAN_END
rollback;
