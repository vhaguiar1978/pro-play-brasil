# Deploy do Pro Play Brasil — checklist passo a passo

Tempo estimado: **45-60 minutos** (se nunca usou Supabase/Vercel).

Você já tem `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`, então o projeto Supabase
parece existir. Só falta o resto.

---

## Passo 1 — Pegar a service role key do Supabase (2 min)

1. Acessa [supabase.com](https://supabase.com) e abre seu projeto.
2. Menu lateral: **Project Settings** (ícone de engrenagem) → **API**.
3. Em **Project API keys**, role até **service_role**.
4. Clica em **Reveal** e copia a key. Começa com `eyJ...` e é LONGA.
5. Cola no teu `.env.local` em `SUPABASE_SERVICE_ROLE_KEY=...`.

> ⚠️ Nunca commita essa key. O `.gitignore` já protege `.env.local`.

---

## Passo 2 — Rodar o SQL das tabelas (5 min)

1. No mesmo projeto Supabase, menu lateral: **SQL Editor**.
2. Clica em **New query**.
3. Abre o arquivo [docs/SUPABASE_MIGRATION.md](docs/SUPABASE_MIGRATION.md) no editor.
4. Copia TODOS os blocos `sql` (cria 10 tabelas: games_overrides, tournaments_server,
   interest_clicks, game_suggestions, live_streams, matches, player_avatars,
   player_badges, tournament_registrations, profiles, notifications).
5. Cola no SQL Editor do Supabase e clica em **Run**.
6. Espera o ✓ verde. Se der erro, cola a mensagem aqui que eu te ajudo.

---

## Passo 3 — Criar o bucket de imagens (2 min)

1. Menu lateral: **Storage**.
2. Clica em **New bucket**.
3. Nome: `games`
4. Marca **Public bucket** ✅
5. File size limit: `4 MB`
6. Allowed MIME types: `image/jpeg, image/png, image/webp`
7. **Create**.
8. Clica no bucket `games` → **Policies** → adiciona uma policy de SELECT pública
   (o SQL do passo 2 já inclui isso, mas confirma se o Supabase aplicou).

---

## Passo 4 — Configurar Auth URL (1 min)

Pra `/redefinir-senha` voltar pro lugar certo depois do link de recuperação:

1. Menu lateral: **Authentication** → **URL Configuration**.
2. Em **Site URL**, coloca a URL final do site (ex: `https://proplaybrasil.com`).
   Se ainda não tem domínio, deixa `https://seu-projeto.vercel.app` por enquanto.
3. Em **Redirect URLs**, adiciona:
   ```
   https://seu-dominio.com/redefinir-senha
   https://seu-projeto.vercel.app/redefinir-senha
   http://localhost:3000/redefinir-senha
   ```

---

## Passo 5 — Subir o repo pro GitHub (5 min)

```bash
# Cria o repo no GitHub primeiro (https://github.com/new), depois:
git remote add origin https://github.com/SEU_USUARIO/pro-play-brasil.git
git branch -M main
git push -u origin main
```

---

## Passo 6 — Conectar Vercel (10 min)

1. Acessa [vercel.com/new](https://vercel.com/new) e loga com a mesma conta do GitHub.
2. Em **Import Git Repository**, encontra `pro-play-brasil` e clica **Import**.
3. **Framework Preset**: Next.js (detecta sozinho).
4. **Build Command**: deixa o padrão (`next build`).
5. Em **Environment Variables**, adiciona TUDO isso (copia do teu `.env.local`):

   ```
   NEXT_PUBLIC_SUPABASE_URL          = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ...
   SUPABASE_SERVICE_ROLE_KEY         = eyJ...    ← SECRETO
   ADMIN_EMAILS                      = seu@email.com
   CRON_SECRET                       = <gerar com `openssl rand -hex 32`>
   NEXT_PUBLIC_APP_URL               = https://seu-projeto.vercel.app
   NEXT_PUBLIC_SITE_URL              = https://seu-projeto.vercel.app
   ```

   > **Opcional (e-mail):** se quiser ativar push por e-mail agora, adiciona
   > `RESEND_API_KEY` e `EMAIL_FROM` (precisa domain verification na Resend).

6. Clica **Deploy**.
7. Espera 2-3 min. Vai te dar uma URL tipo `https://pro-play-brasil-xxx.vercel.app`.

---

## Passo 7 — Smoke test (10 min)

Abre a URL da Vercel e testa nessa ordem:

- [ ] Página inicial carrega
- [ ] Cria conta em `/cadastro` com seu e-mail real
- [ ] Confirma o e-mail (chega na sua caixa do Supabase Auth)
- [ ] Loga em `/login`
- [ ] Acessa `/perfil/editar` → preenche nick, salva
- [ ] Sino aparece no header (mesmo vazio)
- [ ] Inscreve em um campeonato (lista em `/campeonatos`)
- [ ] Acessa `/admin` (você foi colocado em `ADMIN_EMAILS`)
- [ ] Vê o painel admin com aba de tournaments/jogos
- [ ] Clica em "Chaveamento" de um campeonato → vê inscritos

Se algo quebrar, vai em **Vercel → Project → Deployments → o último → Function Logs**
pra ver o erro.

---

## Passo 8 — Ligar domínio próprio (5 min, opcional)

Depois que o smoke test passar:

1. Vercel → Project → **Settings** → **Domains**.
2. Adiciona teu domínio. Segue as instruções de DNS (A record ou CNAME).
3. Volta no Supabase → Auth → URL Configuration e atualiza `Site URL` pro
   domínio definitivo.
4. Atualiza `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_SITE_URL` nas envs Vercel
   pro domínio definitivo.
5. Redeploy.

---

## Depois do deploy

- O **cron de auto-confirm de matches** (`vercel.json`) só roda no plano Vercel Pro
  (US$ 20/mês). No Hobby, partidas vencidas só finalizam quando alguém visita a página
  do bracket (lazy sweep — funciona, só não é automático).
- **E-mail Resend:** sem domain verification, e-mails caem em spam.
- **Imagens dos jogos:** o bucket começa vazio. Faz upload manual dos arquivos
  em `/public/games/<slug>/*` pro bucket `games` (drag & drop pelo dashboard).
  Sem isso, jogos ficam com placeholder mas o sistema funciona.

---

## Problemas comuns

**"Não consigo entrar no /admin"**
→ Confere `ADMIN_EMAILS` na Vercel. O e-mail tem que ser EXATAMENTE igual ao da conta.

**"Inscrição dá erro 404 'Campeonato não encontrado'"**
→ Mock tournaments (FC26, CS2 etc) funcionam. Tournaments criados pelo admin
   precisam ter sido criados após o SQL do Passo 2 rodar.

**"Imagem do jogo não aparece"**
→ Bucket `games` vazio. Sobe os arquivos de `/public/games/` pelo Storage do Supabase.

**"Sino de notificação não aparece"**
→ Só aparece se o user tem `gamertag` setado no perfil. Sem gamertag, fica oculto.

**"Reset de senha não funciona"**
→ Confere `Site URL` e `Redirect URLs` no Supabase Auth (Passo 4).
