import { NextResponse } from "next/server";
import { getActiveBadgeLogos } from "@/lib/player-badges-storage";

// GET /api/players/badges?nicks=a,b,c
// Retorna { logos: { ana: "...", bruno: "..." } } — só ativos com logo.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("nicks") ?? "";
  const nicks = raw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (nicks.length === 0) return NextResponse.json({ logos: {} });
  const logos = await getActiveBadgeLogos(nicks);
  return NextResponse.json({ logos });
}
