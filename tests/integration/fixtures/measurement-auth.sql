-- Contrato de referência para banco LOCAL vazio; não é dump nem migration de produção.
do $$ begin
  if current_setting('promodetec.lab', true) is distinct from 'measurement-auth' then
    raise exception 'lab_only_schema';
  end if;
end $$;

create table public.promodetec_lab_contract (id boolean primary key check (id), version text not null check (version = 'measurement-auth-v1'));
insert into public.promodetec_lab_contract values (true, 'measurement-auth-v1');
alter table public.promodetec_lab_contract enable row level security;
revoke all on public.promodetec_lab_contract from anon, authenticated;
grant select on public.promodetec_lab_contract to service_role;

create table public.produtos (id uuid primary key, titulo text not null, url text not null);
insert into public.produtos values ('12345678-1234-4234-8234-123456789abc', 'Produto fictício do laboratório', 'https://www.amazon.com.br/dp/B000000001');
create view public.vw_ofertas with (security_invoker = true) as
  select id, titulo, url, 'amazon'::text loja_slug, 'Loja fictícia'::text loja_nome from public.produtos;

create table public.eventos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('visita','busca','busca_sem_resultado','abrir_busca','selecionar_busca','ver_produto','abrir_comparacao','ver_categoria','filtrar_ofertas','salvar_produto','remover_salvo','compartilhar_produto','saida_loja','copiar_cupom')),
  termo text, produto_id uuid references public.produtos(id) on delete set null,
  loja_slug text, categoria_slug text, origem text, referer text, dispositivo text,
  navegador text, cidade text, pais text, criado_em timestamptz not null default now()
);
create table public.cliques (
  id bigint generated always as identity primary key,
  produto_id uuid references public.produtos(id) on delete set null,
  loja_slug text, origem text, movel boolean, criado_em timestamptz not null default now()
);
create table public.usuarios (
  id uuid primary key default gen_random_uuid(), auth_id uuid unique references auth.users(id) on delete cascade,
  email text not null, nome text, criado_em timestamptz not null default now(),
  interesses text[] not null default '{}', onboarding_completo boolean not null default false,
  avatar_url text, criado_via text, is_admin boolean not null default false,
  role text not null default 'user' check (role in ('user','operador','moderador','admin','super_admin'))
);
create table public.historico_precos (id bigint generated always as identity primary key, produto_id uuid references public.produtos(id), preco numeric, coletado_em timestamptz not null default now());
create table public.scrape_jobs (id uuid primary key default gen_random_uuid(), adapter_key text not null, status text not null, criado_em timestamptz not null default now());

alter table public.eventos enable row level security;
alter table public.cliques enable row level security;
alter table public.usuarios enable row level security;
alter table public.produtos enable row level security;
create policy lab_products_read on public.produtos for select to anon, authenticated using (true);
create policy lab_profile_read on public.usuarios for select to authenticated using ((select auth.uid()) = auth_id);
create policy lab_profile_update on public.usuarios for update to authenticated
  using ((select auth.uid()) = auth_id) with check ((select auth.uid()) = auth_id);
revoke all on public.eventos, public.cliques, public.usuarios, public.produtos, public.historico_precos, public.scrape_jobs from anon, authenticated;
revoke all on sequence public.eventos_id_seq, public.cliques_id_seq, public.historico_precos_id_seq from anon, authenticated;
grant select on public.produtos, public.vw_ofertas to anon, authenticated;
grant select on public.usuarios to authenticated;
grant update (nome, avatar_url, interesses, onboarding_completo) on public.usuarios to authenticated;
grant all on public.produtos, public.eventos, public.cliques, public.usuarios, public.historico_precos, public.scrape_jobs to service_role;
grant usage, select on sequence public.eventos_id_seq, public.cliques_id_seq, public.historico_precos_id_seq to service_role;

create function public.lab_create_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (auth_id, email, nome, criado_via) values
    (new.id, new.email, new.raw_user_meta_data->>'full_name', 'lab');
  return new;
end $$;
revoke all on function public.lab_create_profile() from public;
create trigger lab_auth_profile after insert on auth.users for each row execute function public.lab_create_profile();

create function public.lab_protect_role() returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (new.role is distinct from old.role or new.is_admin is distinct from old.is_admin) then
    raise exception using errcode = '42501', message = 'privilege_change_denied';
  end if;
  return new;
end $$;
revoke all on function public.lab_protect_role() from public;
create trigger lab_protect_role before update of role, is_admin on public.usuarios for each row execute function public.lab_protect_role();

notify pgrst, 'reload schema';
