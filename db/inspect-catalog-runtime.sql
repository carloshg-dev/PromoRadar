-- Uma leitura limitada por rota: executa EXPLAIN ANALYZE, sem retornar produtos ou escrever dados.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
begin transaction read only;
set local statement_timeout = '5s';
set local lock_timeout = '1s';
set local role anon;
\echo CATALOG_RUNTIME_START
explain (analyze, buffers, format json)
select id,titulo,imagem_url,preco_atual,promo_score,atualizado_em
from public.vw_ofertas
where em_estoque and preco_atual>0 and preco_atual<=1000
  and atualizado_em>=now()-interval '7 days' and atualizado_em<=now()
  and loja_slug<>'aliexpress' and imagem_url is not null
  -- Uma passagem, equivalente às assinaturas conhecidas (inclui variantes com _).
  and imagem_url !~* '(no[-_]?image|placeholder|sem[-_]?imagem|image[-_]?not[-_]?found)'
order by promo_score desc nulls last,atualizado_em desc,id limit 60;
\echo CATALOG_RUNTIME_END
rollback;
