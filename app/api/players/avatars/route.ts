import { NextResponse } from "next/server";
import { getAvatarsBatch } from "@/lib/player-avatars-storage";

// GET /api/players/avatars?nicks=ana,bruno,carlos
// Retorna { avatars: { ana: "...", bruno: "..." } } — só os que têm.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("nicks") ?? "";
  const nicks = raw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (nicks.length === 0) return NextResponse.json({ avatars: {} });
  const avatars = await getAvatarsBatch(nicks);
  return NextResponse.json({ avatars });
}
