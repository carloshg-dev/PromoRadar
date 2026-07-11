-- =====================================================================
-- PromoDetec · Pipeline de Conteúdo v4.0 — tabela CAMPANHAS (núcleo)
-- Fonte única da verdade do fluxo Curadoria→Campaign→Render→Publisher.
-- Rodar UMA vez no editor SQL do Supabase. Idempotente (IF NOT EXISTS).
-- =====================================================================

create table if not exists public.campanhas (
  id            uuid primary key default gen_random_uuid(),
  produto_id    uuid,                     -- referência lógica a produtos.id (sem FK rígida: produto pode sair de estoque)
  loja_slug     text,
  -- máquina de estados: PENDING → CURATED → RENDERED → READY → PUBLISHED | FAILED
  status        text not null default 'PENDING',
  score_conteudo integer,
  headline      text,
  legenda       text,
  hashtags      text[]      default '{}',
  imagens       jsonb       default '{}'::jsonb,  -- { feed: "<path/url>", story: "..." }
  plataformas   text[]      default '{}',         -- destinos: {telegram,discord,...}
  metadados     jsonb       default '{}'::jsonb,  -- preço, desconto, histórico, promo_score...
  erro          text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  publicado_em  timestamptz
);

-- Índices dos acessos quentes: por status (o pipeline filtra por etapa) e
-- anti-repetição (produto já teve campanha recente?).
create index if not exists idx_campanhas_status  on public.campanhas (status);
create index if not exists idx_campanhas_produto on public.campanhas (produto_id, criado_em desc);
create index if not exists idx_campanhas_criado  on public.campanhas (criado_em desc);

-- atualizado_em automático
create or replace function public.tocar_atualizado_em() returns trigger as $$
begin new.atualizado_em := now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_campanhas_touch on public.campanhas;
create trigger trg_campanhas_touch before update on public.campanhas
  for each row execute function public.tocar_atualizado_em();

-- RLS: leitura pública (site/analytics podem ler o que foi publicado);
-- escrita SÓ pelo service_role (o pipeline), que ignora RLS por natureza.
alter table public.campanhas enable row level security;
drop policy if exists campanhas_leitura_publica on public.campanhas;
create policy campanhas_leitura_publica on public.campanhas for select using (true);
