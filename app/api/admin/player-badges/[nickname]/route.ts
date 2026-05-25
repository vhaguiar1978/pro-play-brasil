import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { revokeBadge, setBadgeActive } from "@/lib/player-badges-storage";

// PATCH body: { active: true|false } → pausa/reativa
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { nickname } = await params;
  const body = await request.json().catch(() => null);
  const active = !!body?.active;
  const badge = await setBadgeActive(decodeURIComponent(nickname), active);
  if (!badge) return NextResponse.json({ error: "Selo não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, badge });
}

// DELETE → remove o selo (com logo)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { nickname } = await params;
  await revokeBadge(decodeURIComponent(nickname));
  return NextResponse.json({ ok: true });
}
