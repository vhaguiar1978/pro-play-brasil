import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { rejectHeldBet } from "@/lib/betting-server-storage";

// POST /api/admin/bets/[id]/reject
// Body: { note?: string }
// Admin confirma fraude. Stake NÃO volta (penalidade), bet vira settled_loss.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) {
    return NextResponse.json(
      { error: "Nota obrigatória pra rejeitar (registro de auditoria)" },
      { status: 400 }
    );
  }

  const result = await rejectHeldBet(decodeURIComponent(id), note);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
