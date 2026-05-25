import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  markAllNotificationsRead,
  readNotifications
} from "@/lib/notifications-storage";

// Resolve o nick do usuário logado via Supabase Auth.
// Retorna null se não tem sessão ou se Supabase não tá configurado
// (modo dev sem auth — aceita ?nick= como fallback nesse caso).
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
  // Dev sem Supabase: usa ?nick= pra continuar testando
  const url = new URL(request.url);
  return url.searchParams.get("nick")?.trim() ?? null;
}

// GET /api/notifications
// Lê notificações do usuário logado (resolve nick via sessão).
export async function GET(request: Request) {
  const nick = await resolveNick(request);
  if (!nick) return NextResponse.json({ notifications: [], unread: 0 });
  const notifications = await readNotifications(nick);
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unread });
}

// POST /api/notifications  → marca todas como lidas (do usuário logado)
export async function POST(request: Request) {
  const nick = await resolveNick(request);
  if (!nick) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await markAllNotificationsRead(nick);
  return NextResponse.json({ ok: true });
}
