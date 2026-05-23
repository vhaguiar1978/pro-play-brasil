create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  gamertag text unique not null,
  cpf text unique,
  whatsapp text not null default '',
  platform text not null default 'PC',
  twitch text not null default '',
  bio text not null default '',
  cep text not null default '',
  address text not null default '',
  address_number text not null default '',
  complement text not null default '',
  city text not null default '',
  state text not null default '',
  team_by_game jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'penalized', 'banned')),
  penalty_reason text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ppc_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ppc_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount integer not null check (amount > 0),
  direction text not null check (direction in ('in', 'out')),
  source text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null,
  full_name text not null,
  ppc_amount integer not null check (ppc_amount > 0),
  brl_estimate numeric(10,2) not null,
  pix_key text not null,
  contact text not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'recusado')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.player_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tournament_id text not null,
  tournament_name text not null,
  played_at timestamptz not null,
  round_label text not null,
  result_label text not null,
  campaign_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  nickname text not null,
  full_name text not null default '',
  email text not null default '',
  subject text not null,
  message text not null,
  status text not null default 'aberta' check (status in ('aberta', 'respondida', 'encerrada')),
  admin_reply text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  tournament_id text not null,
  nickname text not null,
  team_name text not null default '',
  platform text not null,
  whatsapp text not null,
  payment_method text not null default 'free',
  payment_status text not null default 'free',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_wallets_updated_at on public.ppc_wallets;
create trigger set_wallets_updated_at
before update on public.ppc_wallets
for each row execute function public.set_updated_at();

drop trigger if exists set_complaints_updated_at on public.complaints;
create trigger set_complaints_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.ppc_wallets enable row level security;
alter table public.ppc_ledger enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.player_history enable row level security;
alter table public.complaints enable row level security;
alter table public.tournament_registrations enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "wallet_select_own_or_admin" on public.ppc_wallets;
create policy "wallet_select_own_or_admin"
on public.ppc_wallets
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "wallet_update_admin" on public.ppc_wallets;
create policy "wallet_update_admin"
on public.ppc_wallets
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "wallet_insert_admin" on public.ppc_wallets;
create policy "wallet_insert_admin"
on public.ppc_wallets
for insert
with check (public.is_admin());

drop policy if exists "ledger_select_own_or_admin" on public.ppc_ledger;
create policy "ledger_select_own_or_admin"
on public.ppc_ledger
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "ledger_insert_own_or_admin" on public.ppc_ledger;
create policy "ledger_insert_own_or_admin"
on public.ppc_ledger
for insert
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "withdraw_select_own_or_admin" on public.withdrawal_requests;
create policy "withdraw_select_own_or_admin"
on public.withdrawal_requests
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "withdraw_insert_own" on public.withdrawal_requests;
create policy "withdraw_insert_own"
on public.withdrawal_requests
for insert
with check (auth.uid() = user_id);

drop policy if exists "withdraw_update_admin" on public.withdrawal_requests;
create policy "withdraw_update_admin"
on public.withdrawal_requests
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "history_select_own_or_admin" on public.player_history;
create policy "history_select_own_or_admin"
on public.player_history
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "history_insert_admin" on public.player_history;
create policy "history_insert_admin"
on public.player_history
for insert
with check (public.is_admin());

drop policy if exists "complaints_select_own_or_admin" on public.complaints;
create policy "complaints_select_own_or_admin"
on public.complaints
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "complaints_insert_any_authenticated" on public.complaints;
create policy "complaints_insert_any_authenticated"
on public.complaints
for insert
with check (auth.role() = 'authenticated');

drop policy if exists "complaints_update_admin" on public.complaints;
create policy "complaints_update_admin"
on public.complaints
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "registrations_select_own_or_admin" on public.tournament_registrations;
create policy "registrations_select_own_or_admin"
on public.tournament_registrations
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "registrations_insert_own" on public.tournament_registrations;
create policy "registrations_insert_own"
on public.tournament_registrations
for insert
with check (auth.uid() = user_id);

drop policy if exists "registrations_update_own_or_admin" on public.tournament_registrations;
create policy "registrations_update_own_or_admin"
on public.tournament_registrations
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());
