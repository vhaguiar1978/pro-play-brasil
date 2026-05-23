-- ============================================================
-- CRM Labels: etiquetas personalizadas para classificar usuarios
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- Tabela de etiquetas disponíveis (criadas pelo admin)
create table if not exists public.crm_labels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  color       text not null default '#ff6a00',
  created_at  timestamptz not null default now()
);

-- Tabela de relacionamento: usuario <-> etiqueta (N:N)
create table if not exists public.user_labels (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  label_id   uuid not null references public.crm_labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, label_id)
);

-- Ativar RLS
alter table public.crm_labels enable row level security;
alter table public.user_labels enable row level security;

-- Apenas admin pode ler/escrever crm_labels
create policy "Admin le etiquetas"
  on public.crm_labels for select
  using (true);

create policy "Admin gerencia etiquetas"
  on public.crm_labels for all
  using (auth.role() = 'service_role');

-- Apenas admin pode ler/escrever user_labels
create policy "Admin le associacoes"
  on public.user_labels for select
  using (true);

create policy "Admin gerencia associacoes"
  on public.user_labels for all
  using (auth.role() = 'service_role');
