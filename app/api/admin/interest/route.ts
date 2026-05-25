import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { getClicksGroupedBySlug, getSuggestionsRanked, readGamesStatus } from "@/lib/interest-storage";

export async function GET() {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const [grouped, statuses, ranked] = await Promise.all([
    getClicksGroupedBySlug(),
    readGamesStatus(),
    getSuggestionsRanked()
  ]);
  return NextResponse.json({ grouped, statuses, ranked });
}
