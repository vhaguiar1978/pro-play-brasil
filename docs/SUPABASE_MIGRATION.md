# Migração para Supabase (deploy em Vercel)

Este documento explica como tirar o site do storage local (`/data/*.json` + `/public/games/`) e mover tudo pra Supabase Storage + Postgres. Sem isso, o deploy em Vercel não funciona porque o filesystem é read-only.

A boa notícia: tudo já está abstraído. Você só precisa **criar as tables/bucket no Supabase** e **adicionar 1 variável de ambiente**.

---

## 1. Variáveis de ambiente

Adicione no `.env.local` (e na configuração de env da Vercel):

```bash
# Já existem:
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

# NOVA — pega em: Project Settings → API → service_role key (secret!)
# NUNCA expor no client. Só em variáveis server-side.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Emails autorizados a acessar /admin (separados por vírgula).
# A checagem é feita server-side em getServerAdminAccess.
ADMIN_EMAILS=voce@dominio.com,outro@equipe.com

# (Opcional) Push de notificação por e-mail via Resend.
# Sem essa key, notificações ficam só in-site (sino). Com a key,
# eventos críticos (partida pronta, finalizada, contestada, bracket gerado)
# disparam e-mail pro destinatário.
RESEND_API_KEY=re_...
EMAIL_FROM="Pro Play Brasil <no-reply@seu-dominio.com>"

# (Opcional) URL pública usada nos links dentro dos e-mails. Sem isso,
# usa "https://proplaybrasil.com" como fallback.
NEXT_PUBLIC_SITE_URL=https://proplaybrasil.com

# (Opcional) Secret pro endpoint de cron job (Vercel Crons).
# Vercel envia o header `Authorization: Bearer <CRON_SECRET>` automaticamente
# nos crons configurados em vercel.json. Sem essa env, o endpoint fica aberto
# (ok pra dev, NÃO ok pra prod). Gere com `openssl rand -hex 32`.
CRON_SECRET=...
```

### Cron job: auto-confirmação de partidas

O arquivo [vercel.json](../vercel.json) já registra o cron que finaliza partidas com `result_submitted` cujo prazo de 10min expirou sem o adversário responder.

```json
{
  "crons": [
    { "path": "/api/cron/auto-confirm-matches", "schedule": "*/2 * * * *" }
  ]
}
```

Sem o cron, partidas vencidas só são auto-confirmadas quando alguém visita a página do bracket (lazy sweep). Com o cron, o sistema processa sozinho a cada 2min.

Sem `ADMIN_EMAILS`, ninguém consegue entrar no painel `/admin` mesmo logado — só o e-mail listado vira admin. Os demais usuários comuns continuam acessando o resto do site normalmente.

Quando o site detectar `SUPABASE_SERVICE_ROLE_KEY` definido, todos os storages mudam automaticamente para Supabase. Sem ele, continua usando filesystem local (modo dev).

---

## 2. Criar o bucket de Storage

No Supabase Dashboard:

1. **Storage** → **Create bucket**
2. Nome: `games`
3. Marque **Public bucket** ✅ (imagens precisam ser acessíveis publicamente)
4. File size limit: `4 MB`
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

Depois, em **Policies** do bucket `games`, adicione:

```sql
-- Permite leitura pública (necessário pra exibir imagens no site)
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'games');

-- Apenas service-role escreve (já vem por padrão, mas confirme)
-- Se preferir bloquear: deixe sem INSERT/UPDATE/DELETE pra public.
```

A migração das imagens locais (`/public/games/<slug>/*`) para o bucket pode ser feita manualmente pelo Dashboard (drag & drop) ou via CLI:

```bash
# Estrutura final no bucket:
games/fifa/cover.jpg
games/fifa/hero.jpg
games/fifa/gallery1.jpg
games/free-fire/cover.jpg
# ... etc
```

---

## 3. Criar as tables no Postgres

Cole no **SQL Editor** do Supabase e execute:

```sql
-- ─────────────── games_overrides ───────────────
-- Persistência do CRUD de jogos (admin pode editar nome, descrição, cor, status)
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
```

### Tables adicionais (recursos novos)

Rode também os blocos abaixo — sem eles os recursos de streams ao vivo, chaveamento, avatares, selos de campeão e inscrição pública não funcionam em prod.

```sql
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

-- ─── wallets ───
-- Carteira PPC de cada jogador. Fonte de verdade do saldo (NUNCA confiar
-- em client/localStorage). Toda mutação passa por lib/wallet-server-storage.ts.
CREATE TABLE IF NOT EXISTS public.wallets (
  nickname TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Leitura pública (saldo aparece no perfil, ranking de PPC etc).
-- Se quiser esconder, troque por policy USING (auth.uid() = id_do_dono).
CREATE POLICY "Public read wallets"
ON public.wallets FOR SELECT USING (true);
-- INSERT/UPDATE só via service-role (wallet-server-storage).

-- ─── ppc_ledger ───
-- Histórico imutável de transações PPC. Append-only — nunca editar/deletar
-- linhas em produção, só inserir. Auditoria completa de pra onde foi cada PPC.
CREATE TABLE IF NOT EXISTS public.ppc_ledger (
  id UUID PRIMARY KEY,
  recipient_nick TEXT NOT NULL,
  type TEXT NOT NULL,             -- 'purchase' | 'tournament_fee' | 'bet_stake' | etc
  amount INTEGER NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  source TEXT NOT NULL,           -- id de campeonato, market, payment, etc
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_recipient_date
  ON public.ppc_ledger (recipient_nick, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_source
  ON public.ppc_ledger (source);

ALTER TABLE public.ppc_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ledger"
ON public.ppc_ledger FOR SELECT USING (true);

-- ─── ppc_purchases ───
-- Registro de compras de PPC via gateway (Mercado Pago). Sem dados de cartão.
-- Status transita: pending → approved (webhook) | rejected | refunded.
CREATE TABLE IF NOT EXISTS public.ppc_purchases (
  id UUID PRIMARY KEY,
  nickname TEXT NOT NULL,
  package_id TEXT NOT NULL,
  amount_ppc INTEGER NOT NULL CHECK (amount_ppc > 0),
  amount_brl NUMERIC(10,2) NOT NULL CHECK (amount_brl > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_nick ON public.ppc_purchases (nickname, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_mp_payment ON public.ppc_purchases (mp_payment_id);

ALTER TABLE public.ppc_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read purchases"
ON public.ppc_purchases FOR SELECT USING (true);
-- INSERT/UPDATE só via service-role.

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
```

> **Atenção:** as policies acima só liberam **leitura pública**. Toda escrita
> (insert/update/delete) passa pelo service-role no servidor — nunca pelo
> client. Isso evita que alguém crie inscrições falsas direto pela anon key.

```sql
-- ─── SISTEMA DE APOSTAS (casa nunca perde) ───
-- Pool betting com rake fixo. Stake é debitado da wallet na hora de apostar
-- (via ppc_ledger type='bet_stake'). Quando o match finaliza, o lib
-- lib/betting-server-storage.ts roda settleBetsForMatch() e credita os
-- vencedores (type='bet_payout'). Apostas com cheiro de fraude viram
-- status='flagged_hold': pool processa mas payout fica retido até admin.
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY,
  match_id TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  bettor_nick TEXT NOT NULL,
  side TEXT NOT NULL,                 -- 'A' | 'B'
  stake INTEGER NOT NULL,             -- PPC debitado
  potential_payout INTEGER,           -- calculado na liquidação
  status TEXT NOT NULL,               -- open | locked | settled_win | settled_loss | void | flagged_hold
  flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  ip TEXT                             -- cross-check de fraude (IP collision)
);

CREATE INDEX IF NOT EXISTS idx_bets_match ON public.bets (match_id);
CREATE INDEX IF NOT EXISTS idx_bets_bettor ON public.bets (bettor_nick);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets (status);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
-- Leitura pública dos pools (qualquer um pode ver as odds correntes).
CREATE POLICY "Public read bets"
ON public.bets FOR SELECT USING (true);
-- INSERT/UPDATE só via service-role. Cliente NUNCA grava direto.

CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id UUID PRIMARY KEY,
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- rapid_betting | high_value_new_account | ip_collision | all_in_streak | admin_manual
  score INTEGER NOT NULL,             -- 0-100, quanto mais alto mais suspeito
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved_payout | rejected_void
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  admin_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON public.fraud_flags (status);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_bet ON public.fraud_flags (bet_id);

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
-- Sem policy pública: a fila de flags é APENAS do admin (service-role).
```

---

## 4. Migrar os dados existentes (opcional)

Se quiser preservar o que já existe em `/data/*.json` e `/public/games/`:

```bash
# 1. Suba o site uma vez em dev local com as credenciais Supabase configuradas
# 2. Rode o script de migração que copia dos arquivos pro Supabase
npm run migrate:supabase  # (vou criar esse script quando você pedir)

# OU manualmente:
# - Copie /data/*.json para Postgres via SQL Insert
# - Faça upload de /public/games/*/* pra Storage via Dashboard
```

Em produção pura (deploy novo), pode pular esse passo — o sistema começa com dados vazios e o admin recadastra tudo via UI.

---

## 5. Checklist antes do deploy

- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada nas envs (Vercel + .env.local)
- [ ] Bucket `games` criado e público
- [ ] Tables criadas com policies aplicadas
- [ ] Dados migrados (se desejar)
- [ ] **Atalho:** rode `npm run prepare:deploy:dry` (ver o que será removido) e depois `npm run prepare:deploy` pra apagar tudo automaticamente. Mesmo se esquecer, as preview pages têm um guard `NODE_ENV === "production"` que retorna 404. Mas o ideal é deletar.
- [ ] **Build local:** `npm run build` agora tem um `prebuild` que aborta se detectar `npm run dev` rodando em :3000 (evita corromper o `.next/`). Em CI/Vercel o check é ignorado automaticamente. Pra forçar local: `PPB_BUILD_FORCE=1 npm run build`.
- [ ] Apagar rotas de preview (bypass de auth — não pode ir pra prod):
  - `app/admin/jogos-preview/` (inclui subpasta `campeonatos/`)
  - `app/api/admin/games-preview/`
  - `app/api/admin/interest-preview/`
  - `app/api/admin/tournaments-preview/`
  - `app/api/admin/player-badges-preview/`
  - Qualquer outra rota com sufixo `-preview` em `app/api/admin/`

---

## 6. Como funciona o switching no código

A função `getStorageBackend()` em [lib/server-storage.ts](../lib/server-storage.ts) detecta o ambiente:

```ts
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return "supabase"; // produção
}
return "fs"; // dev local
```

Sem service-role, fica em modo dev (filesystem). Com ela, vai pra Supabase. Mesmo código, dois ambientes.

---

## Suporte

Se algo não funcionar:
1. Confira no Dashboard se o bucket está **public**
2. Confira se as **policies** estão aplicadas (Database → Policies)
3. Verifique nos **logs da Vercel** se há erro "service_role not set"
