-- Tabela de anúncios de recrutamento de jogadores
-- Execute este SQL no painel do Supabase > SQL Editor

create table if not exists public.recruitment_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  author_nick text not null,
  game text not null,
  message text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.recruitment_posts enable row level security;

-- Qualquer usuário autenticado pode ler
drop policy if exists "recruitment_select_authenticated" on public.recruitment_posts;
create policy "recruitment_select_authenticated"
on public.recruitment_posts
for select
using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- Só o dono pode inserir
drop policy if exists "recruitment_insert_own" on public.recruitment_posts;
create policy "recruitment_insert_own"
on public.recruitment_posts
for insert
with check (auth.uid() = user_id);

-- Dono ou admin pode deletar
drop policy if exists "recruitment_delete_own_or_admin" on public.recruitment_posts;
create policy "recruitment_delete_own_or_admin"
on public.recruitment_posts
for delete
using (auth.uid() = user_id or public.is_admin());

-- Índice para buscar posts ativos ordenados por data
create index if not exists recruitment_posts_expires_idx on public.recruitment_posts (expires_at desc);
create index if not exists recruitment_posts_game_idx on public.recruitment_posts (game);
