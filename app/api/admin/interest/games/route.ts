import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { getClicksGroupedBySlug, readGamesStatus } from "@/lib/interest-storage";

export async function GET() {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const [grouped, statuses] = await Promise.all([
    getClicksGroupedBySlug(),
    readGamesStatus()
  ]);
  return NextResponse.json({ grouped, statuses });
}
