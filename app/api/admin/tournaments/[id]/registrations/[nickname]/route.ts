import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { removeRegistration } from "@/lib/tournament-registrations-server-storage";

// DELETE /api/admin/tournaments/[id]/registrations/[nickname]
// Remove uma inscrição manualmente (admin).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; nickname: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id, nickname } = await params;
  await removeRegistration(id, decodeURIComponent(nickname));
  return NextResponse.json({ ok: true });
}
