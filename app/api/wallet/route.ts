import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWallet } from "@/lib/wallet-server-storage";

// Resolve o nick do usuário logado via Supabase Auth. Em dev sem Supabase,
// aceita ?nick= como fallback (pra testar localmente).
async function resolveNick(request: Request): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const gamertag =
        user?.user_metadata && typeof user.user_metadata === "object"
          ? (user.user_metadata as { gamertag?: unknown }).gamertag
          : null;
      if (typeof gamertag === "string" && gamertag.trim()) return gamertag.trim();
      return null;
    } catch {
      return null;
    }
  }
  const url = new URL(request.url);
  return url.searchParams.get("nick")?.trim() ?? null;
}

// GET /api/wallet → { balance, updatedAt } da carteira do usuário logado.
// Sem sessão, retorna { balance: null } (UI mostra "faça login").
export async function GET(request: Request) {
  const nick = await resolveNick(request);
  if (!nick) return NextResponse.json({ balance: null, nick: null });
  try {
    const wallet = await getOrCreateWallet(nick);
    return NextResponse.json({
      nick: wallet.nickname,
      balance: wallet.balance,
      updatedAt: wallet.updatedAt
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
