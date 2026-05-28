import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { getPendingFlags } from "@/lib/betting-server-storage";

// GET /api/admin/fraud-flags
// Lista a fila de flags pendentes pro admin revisar.
// Painel admin chama essa rota pra montar a fila e depois usa
// /api/admin/bets/[id]/approve|reject pra resolver cada uma.
export async function GET() {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  try {
    const flags = await getPendingFlags();
    return NextResponse.json({ flags, count: flags.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
