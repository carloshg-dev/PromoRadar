-- Índice de leitura validado em fixture isolado; não altera preços, estoque ou políticas.
-- O workflow confirma o projeto. CONCURRENTLY evita bloquear as escritas normais.
\set ON_ERROR_STOP on
set lock_timeout = '1s';
set statement_timeout = '30s';
set maintenance_work_mem = '32MB';
set max_parallel_maintenance_workers = 0;
do $$ begin
  if pg_database_size(current_database()) > 400*1024*1024 then
    raise exception 'catalog_index_storage_review_required';
  end if;
  if exists (select 1 from pg_index i join pg_class c on c.oid=i.indexrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='idx_produtos_vitrine_ordem' and not i.indisvalid) then
    raise exception 'catalog_invalid_index_requires_reconciliation';
  end if;
end $$;
create index concurrently if not exists idx_produtos_vitrine_ordem
  on public.produtos (promo_score desc nulls last, atualizado_em desc, id)
  where em_estoque=true and preco_atual>0 and imagem_url is not null;
analyze public.produtos (promo_score, atualizado_em, em_estoque, preco_atual, imagem_url, loja_id, categoria_id);
do $$ begin
  if not exists (select 1 from pg_index i join pg_class c on c.oid=i.indexrelid
    join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
    and c.relname='idx_produtos_vitrine_ordem' and i.indisvalid and i.indisready
    and pg_get_indexdef(c.oid) like '%(promo_score DESC NULLS LAST, atualizado_em DESC, id)%') then
    raise exception 'catalog_index_contract_not_confirmed';
  end if;
end $$;
select 'CATALOG_INDEX_RECEIPT='||jsonb_build_object('name','idx_produtos_vitrine_ordem',
  'valid',i.indisvalid,'ready',i.indisready,'bytes',pg_relation_size(c.oid),
  'databaseBytes',pg_database_size(current_database()))::text
from pg_index i join pg_class c on c.oid=i.indexrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='idx_produtos_vitrine_ordem';
