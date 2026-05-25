import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { createServerTournament, readServerTournaments } from "@/lib/tournaments-server-storage";

export async function GET() {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const all = await readServerTournaments();
  return NextResponse.json({ tournaments: all });
}

export async function POST(request: Request) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const raw = await request.json().catch(() => null);
  const result = await createServerTournament(raw);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, tournament: result });
}
