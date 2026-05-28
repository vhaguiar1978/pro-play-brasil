CREATE TABLE IF NOT EXISTS public.games_overrides (
  slug TEXT PRIMARY KEY,
  name TEXT,
  short_description TEXT,
  theme_color TEXT,
  status TEXT CHECK (status IN ('active', 'frozen', 'hidden')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.games_overrides ENABLE ROW LEVEL SECURITY;

-- Leitura pública (pra páginas /jogos e /jogos/[slug] funcionarem)
CREATE POLICY "Public read games_overrides"
ON public.games_overrides FOR SELECT USING (true);

-- Escrita só via service-role (admin)
-- (sem policy pra INSERT/UPDATE/DELETE — service_role bypassa RLS)

-- ─────────────── tournaments_server ───────────────
-- Campeonatos criados pelo admin
CREATE TABLE IF NOT EXISTS public.tournaments_server (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  origin TEXT DEFAULT 'official',
  description TEXT,
  platform TEXT NOT NULL,
  max_players INT NOT NULL,
  minimum_players INT,
  registered INT DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  fee_label TEXT,
  prize TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL,
  region_label TEXT NOT NULL,
  participants JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournaments_server ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tournaments_server"
ON public.tournaments_server FOR SELECT USING (true);

CREATE INDEX idx_tournaments_game_slug ON public.tournaments_server(game_slug);
CREATE INDEX idx_tournaments_status ON public.tournaments_server(status);

-- ─────────────── interest_clicks ───────────────
-- Quem clicou em "Quero esse campeonato" nas páginas congeladas
CREATE TABLE IF NOT EXISTS public.interest_clicks (
  id TEXT PRIMARY KEY,
  game_slug TEXT NOT NULL,
  nick TEXT NOT NULL,
  tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interest_clicks ENABLE ROW LEVEL SECURITY;

-- Permite que qualquer um INSIRA (é registro de interesse público)
CREATE POLICY "Public insert clicks"
ON public.interest_clicks FOR INSERT WITH CHECK (true);

-- Permite leitura agregada apenas via service-role (admin)
-- Não criar policy de SELECT pra public!

CREATE INDEX idx_clicks_game ON public.interest_clicks(game_slug);

-- ─────────────── game_suggestions ───────────────
-- Sugestões de novos jogos vindo do form da Home
CREATE TABLE IF NOT EXISTS public.game_suggestions (
  id TEXT PRIMARY KEY,
  game_name TEXT NOT NULL,
  nick TEXT NOT NULL,
  tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert suggestions"
ON public.game_suggestions FOR INSERT WITH CHECK (true);

-- ─── live_streams ───
-- Quem está transmitindo agora (botão "estou ao vivo" no editor de perfil)
CREATE TABLE IF NOT EXISTS public.live_streams (
  nickname TEXT PRIMARY KEY,
  game_slug TEXT NOT NULL,
  twitch_url TEXT NOT NULL,
  title TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read live_streams"
ON public.live_streams FOR SELECT USING (true);

-- ─── matches ───
-- Bracket de eliminação simples; avança vencedor automaticamente.
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  round_label TEXT NOT NULL,
  player_a JSONB,
  player_b JSONB,
  status TEXT NOT NULL,
  submitted_score_a INTEGER,
  submitted_score_b INTEGER,
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  score_a INTEGER,
  score_b INTEGER,
  winner TEXT,
  finalized_at TIMESTAMPTZ,
  next_match_id TEXT,
  next_match_slot TEXT,
  proof_url_submitted TEXT,
  proof_url_disputed TEXT,
  auto_confirm_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches (tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches (status);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read matches"
ON public.matches FOR SELECT USING (true);

-- ─── player_avatars ───
-- Foto/avatar de cada jogador (uma por nickname).
CREATE TABLE IF NOT EXISTS public.player_avatars (
  nickname TEXT PRIMARY KEY,
  photo_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.player_avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read avatars"
ON public.player_avatars FOR SELECT USING (true);

-- ─── player_badges ───
-- Selo de campeão (logo ao lado do nick). Concedido ao vencer final
-- (grantedBy = 'champion') ou manualmente pelo admin ('admin').
CREATE TABLE IF NOT EXISTS public.player_badges (
  nickname TEXT PRIMARY KEY,
  logo_url TEXT,
  granted_by TEXT NOT NULL,           -- 'champion' | 'admin'
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_reason TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read badges"
ON public.player_badges FOR SELECT USING (true);

-- ─── profiles ───
-- Espelho dos usuários do Supabase Auth + metadados editáveis pelo perfil.
-- Linha sincronizada por `ensureCurrentProfile()` (lib/server-profile.ts)
-- todo login. `lookupEmailByGamertag` lê daqui pra mandar e-mail de notificação.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  gamertag TEXT NOT NULL DEFAULT '',
  cpf TEXT,
  whatsapp TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'PC',
  twitch TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  cep TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  address_number TEXT NOT NULL DEFAULT '',
  complement TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  team_by_game JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',          -- 'active' | 'penalized' | 'banned'
  penalty_reason TEXT NOT NULL DEFAULT '',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice case-insensitive em gamertag (lookups de notificação, perfil, ranking)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_gamertag_lower
  ON public.profiles (LOWER(gamertag))
  WHERE gamertag <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (LOWER(email));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Leitura pública dos campos não-sensíveis (gamertag, platform, twitch, bio).
-- O cliente NUNCA deve fazer SELECT * — só select de colunas seguras.
-- INSERT/UPDATE/DELETE só via service-role (server-profile.ts).
CREATE POLICY "Public read profiles"
ON public.profiles FOR SELECT USING (true);

-- ─── notifications ───
-- Notificações in-site (sino no header). Polling de 30s no client.
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY,
  recipient_nick TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON public.notifications (recipient_nick, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read notifications"
ON public.notifications FOR SELECT USING (true);
-- INSERT/UPDATE só via service-role.

-- ─── tournament_registrations ───
-- Inscrição pública. Quando count == tournaments_server.max_players,
-- o backend dispara generateBracket automaticamente.
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  tournament_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  team_name TEXT,
  platform TEXT NOT NULL,
  whatsapp TEXT NOT NULL,             -- usado pra notificar partidas
  payment_method TEXT NOT NULL,       -- 'free' | 'mercado_pago' | 'pagseguro' | 'ppc'
  payment_status TEXT NOT NULL,       -- 'free' | 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tournament_id, nickname)
);

CREATE INDEX IF NOT EXISTS idx_registrations_tournament
  ON public.tournament_registrations (tournament_id);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read registrations"
ON public.tournament_registrations FOR SELECT USING (true);
-- INSERT/DELETE só via service-role (não há policy pública).

