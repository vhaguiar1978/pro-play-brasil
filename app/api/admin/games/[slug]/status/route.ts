// Mantido por compatibilidade: clientes antigos chamavam POST /api/admin/games/[slug]/status
// com body { status }. Hoje todo update passa pelo POST /api/admin/games/[slug].
import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { setGameOverride, type GameRuntimeStatus } from "@/lib/games-overrides-storage";

const ALLOWED: GameRuntimeStatus[] = ["active", "frozen", "hidden"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body.status as GameRuntimeStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: `Status inválido. Use: ${ALLOWED.join(", ")}` }, { status: 400 });
  }
  const all = await setGameOverride(slug, { status });
  return NextResponse.json({ ok: true, slug, status, all });
}
