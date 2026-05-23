# Pro Play Brasil

Plataforma de campeonatos online para gamers (web agora, app no futuro).

## Rodar local (Next + Supabase)

1. Crie um projeto no Supabase.
2. Pegue em **Settings → API**:
   - **Project URL**
   - **Anon public key**
3. Cole em `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Em **Authentication → URL Configuration**, configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
5. Rode:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.
