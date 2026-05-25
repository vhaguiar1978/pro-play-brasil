import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPurchasesByNick } from "@/lib/ppc-purchases-server-storage";

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

// GET /api/payments/purchases → histórico de compras do usuário logado.
export async function GET(request: Request) {
  const nick = await resolveNick(request);
  if (!nick) return NextResponse.json({ purchases: [] });
  try {
    const purchases = await listPurchasesByNick(nick);
    return NextResponse.json({ purchases, count: purchases.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
