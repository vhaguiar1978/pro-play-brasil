import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { approveHeldPayout } from "@/lib/betting-server-storage";

// POST /api/admin/bets/[id]/approve
// Body: { note?: string }
// Admin libera o payout de uma aposta em flagged_hold.
// O potential_payout calculado é creditado na wallet do apostador.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  const note = typeof body.note === "string" ? body.note.trim() : "";

  const result = await approveHeldPayout(decodeURIComponent(id), note || "Aprovado pelo admin");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, credited: result.credited ?? 0 });
}
