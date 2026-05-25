import { NextResponse } from "next/server";
import { MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";
import { readServerTournaments } from "@/lib/tournaments-server-storage";

// GET público — lista mock + custom server. Páginas client podem fazer fetch aqui.
export async function GET() {
  const server = await readServerTournaments();
  const all = [...MOCK_TOURNAMENTS, ...server].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  return NextResponse.json({ tournaments: all });
}
