import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import {
  deleteServerTournament,
  getServerTournamentById,
  updateServerTournament
} from "@/lib/tournaments-server-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id } = await params;
  const t = await getServerTournamentById(id);
  if (!t) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ tournament: t });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id } = await params;
  const raw = await request.json().catch(() => null);
  const result = await updateServerTournament(id, raw);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, tournament: result });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id } = await params;
  await deleteServerTournament(id);
  return NextResponse.json({ ok: true });
}
