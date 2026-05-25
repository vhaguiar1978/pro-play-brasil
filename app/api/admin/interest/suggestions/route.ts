import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { getSuggestionsRanked } from "@/lib/interest-storage";

export async function GET() {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const ranked = await getSuggestionsRanked();
  return NextResponse.json({ ranked });
}
