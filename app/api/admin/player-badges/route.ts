import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { grantBadge, readAllBadges } from "@/lib/player-badges-storage";

// GET → lista todos os selos
export async function GET() {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const badges = await readAllBadges();
  return NextResponse.json({ badges });
}

// POST body: { nickname, reason? } → libera manualmente
export async function POST(request: Request) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const nickname = typeof body?.nickname === "string" ? body.nickname : "";
  if (!nickname.trim()) return NextResponse.json({ error: "Nickname obrigatório" }, { status: 400 });
  const reason = typeof body?.reason === "string" ? body.reason : undefined;
  const badge = await grantBadge({ nickname, grantedBy: "admin", reason });
  return NextResponse.json({ ok: true, badge });
}
