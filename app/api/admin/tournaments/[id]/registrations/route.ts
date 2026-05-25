import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { readRegistrationsByTournament } from "@/lib/tournament-registrations-server-storage";

// GET /api/admin/tournaments/[id]/registrations
// Lista admin com WhatsApp + dados completos (usada pra disparar bracket manual e mensagens).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id } = await params;
  const registrations = await readRegistrationsByTournament(id);
  return NextResponse.json({ registrations, count: registrations.length });
}
