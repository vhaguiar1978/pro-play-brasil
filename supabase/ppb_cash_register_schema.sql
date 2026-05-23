-- ============================================================
-- Caixa: sessoes de abertura e fechamento de caixa do admin
-- Execute este script no Supabase SQL Editor
-- ============================================================

create table if not exists public.cash_register_sessions (
  id               uuid primary key default gen_random_uuid(),
  date             date not null,
  opened_at        timestamptz not null default now(),
  closed_at        timestamptz,
  opening_balance  numeric(12,2) not null default 0,
  closing_balance  numeric(12,2),
  notes            text not null default '',
  status           text not null default 'open' check (status in ('open', 'closed')),
  created_at       timestamptz not null default now()
);

alter table public.cash_register_sessions enable row level security;

-- Somente o service_role (admin) pode operar
create policy "Admin gerencia caixa"
  on public.cash_register_sessions for all
  using (auth.role() = 'service_role');
