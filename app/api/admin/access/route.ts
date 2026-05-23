import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";

export async function GET() {
  const access = await getServerAdminAccess();

  return NextResponse.json({
    ok: true,
    canAccess: access.canAccess,
    email: access.email,
    gamertag: access.gamertag
  });
}
