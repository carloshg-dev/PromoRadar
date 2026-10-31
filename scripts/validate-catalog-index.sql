-- Fixture sintético e descartável. Nunca conectar este script a produção.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
begin;
do $$ begin
  if current_database() <> 'promodetec_catalog_lab' then raise exception 'isolated_catalog_lab_required'; end if;
end $$;
set local statement_timeout = '60s';
set local work_mem = '4MB';
set local maintenance_work_mem = '32MB';
create table public.lojas (id uuid primary key, slug text not null unique);
create table public.produtos (
  id uuid primary key, loja_id uuid references public.lojas(id), titulo text,
  imagem_url text, preco_atual numeric, promo_score integer,
  atualizado_em timestamptz, em_estoque boolean, payload text
);
insert into public.lojas select md5('store-'||g)::uuid, case when g=1 then 'aliexpress' else 'fixture-'||g end from generate_series(1,32) g;
insert into public.produtos
select md5('product-'||g)::uuid, md5('store-'||(g%32+1))::uuid, 'Produto sintético '||g,
  case when g%17=0 then null when g%10=0 then 'https://example.invalid/noimage.gif' else 'https://example.invalid/photo.jpg' end,
  ((g%3000)+1)::numeric/2, case when g%11=0 then null else g%101 end,
  now() - (g%15)*interval '1 day', g<=42567, repeat('fixture sem dados reais ',15)
from generate_series(1,121927) g;
create index idx_produtos_promo_score on public.produtos (promo_score desc);
create index idx_produtos_loja on public.produtos (loja_id);
create view public.vw_ofertas as
select p.*, l.slug as loja_slug from public.produtos p join public.lojas l on l.id=p.loja_id where p.em_estoque;
analyze public.produtos;
analyze public.lojas;
create function pg_temp.catalog_plan() returns jsonb language plpgsql as $$
declare plan jsonb;
begin
  execute $query$explain (analyze, buffers, format json)
    select id, titulo, imagem_url, preco_atual, promo_score, atualizado_em
    from public.vw_ofertas
    where em_estoque and preco_atual>0 and preco_atual<=1000
      and atualizado_em>=now()-interval '7 days' and atualizado_em<=now()
      and loja_slug<>'aliexpress' and imagem_url is not null
      and imagem_url not ilike '%noimage%' and imagem_url not ilike '%placeholder%'
    order by promo_score desc nulls last, atualizado_em desc, id limit 60$query$ into plan;
  return plan;
end $$;
create temp table before_result as
select id from public.vw_ofertas where em_estoque and preco_atual>0 and preco_atual<=1000
  and atualizado_em>=now()-interval '7 days' and atualizado_em<=now()
  and loja_slug<>'aliexpress' and imagem_url is not null
  and imagem_url not ilike '%noimage%' and imagem_url not ilike '%placeholder%'
order by promo_score desc nulls last, atualizado_em desc, id limit 60;
select 'PLAN_LAB_BEFORE='||pg_temp.catalog_plan()::text;
create index idx_produtos_vitrine_ordem on public.produtos (promo_score desc nulls last, atualizado_em desc, id)
  where em_estoque=true and preco_atual>0;
analyze public.produtos;
select 'PLAN_LAB_AFTER='||pg_temp.catalog_plan()::text;
do $$ declare same boolean; plan jsonb; begin
  with after_result as (
    select id from public.vw_ofertas where em_estoque and preco_atual>0 and preco_atual<=1000
      and atualizado_em>=now()-interval '7 days' and atualizado_em<=now()
      and loja_slug<>'aliexpress' and imagem_url is not null
      and imagem_url not ilike '%noimage%' and imagem_url not ilike '%placeholder%'
    order by promo_score desc nulls last, atualizado_em desc, id limit 60
  ) select count(*)=60 and not exists (select id from before_result except select id from after_result)
    and not exists (select id from after_result except select id from before_result) into same from after_result;
  if not same then raise exception 'catalog_results_changed'; end if;
  plan := pg_temp.catalog_plan();
  if plan::text not like '%idx_produtos_vitrine_ordem%' then raise exception 'catalog_index_not_selected'; end if;
end $$;
select 'PLAN_LAB_RECEIPT='||jsonb_build_object('fixtureRows',121927,'stockRows',42567,'same60Products',true,
  'indexSelected',true,'indexBytes',pg_relation_size('public.idx_produtos_vitrine_ordem'),
  'tableBytes',pg_total_relation_size('public.produtos'),'syntheticOnly',true)::text;
rollback;
