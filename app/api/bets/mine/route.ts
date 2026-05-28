import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBetsByNick } from "@/lib/betting-server-storage";

// GET /api/bets/mine
// Histórico de apostas do usuário logado.
function readGamertagFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const v = (metadata as { gamertag?: unknown }).gamertag;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ bets: [] });

  const gamertag = readGamertagFromMetadata(user.user_metadata);
  if (!gamertag) return NextResponse.json({ bets: [] });

  try {
    const bets = await getBetsByNick(gamertag, 50);
    return NextResponse.json({ bets, count: bets.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
