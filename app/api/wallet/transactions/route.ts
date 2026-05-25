import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readLedger } from "@/lib/wallet-server-storage";

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

// GET /api/wallet/transactions?limit=100 → últimas transações do usuário logado.
export async function GET(request: Request) {
  const nick = await resolveNick(request);
  if (!nick) return NextResponse.json({ transactions: [] });
  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 100)));
  try {
    const transactions = await readLedger(nick, limit);
    return NextResponse.json({ transactions, count: transactions.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
