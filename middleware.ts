import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/arena/:path*",
    "/perfil/:path*",
    "/api/admin/:path*",
    "/api/bets/:path*",
    "/api/complaints/:path*",
    "/api/notifications/:path*",
    "/api/payments/checkout",
    "/api/payments/mercado-pago/confirm",
    "/api/payments/mercado-pago/preference",
    "/api/payments/purchases",
    "/api/profile/:path*",
    "/api/recruitment/:path*",
    "/api/tournament-registrations/:path*",
    "/api/wallet/:path*",
    "/api/withdrawals/:path*"
  ]
};
