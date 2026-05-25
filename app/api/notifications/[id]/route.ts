import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markNotificationRead } from "@/lib/notifications-storage";

async function resolveNick(request: Request): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const gamertag =
        user?.user_metadata && typeof user.user_metadata === "object"
          ? (user.user_metadata as { gamertag?: unknown }).gamertag
          : null;
      if (typeof gamertag === "string" && gamertag.trim()) return gamertag.trim();
      return null;
    } catch {
      return null;
    }
  }
  const body = await request.clone().json().catch(() => ({} as { nick?: string }));
  return typeof body.nick === "string" ? body.nick.trim() : null;
}

// PATCH /api/notifications/[id]  → marca uma notificação como lida.
// Só funciona se ela pertencer ao usuário logado.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const nick = await resolveNick(request);
  if (!nick) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await markNotificationRead(id, nick);
  return NextResponse.json({ ok: true });
}
