import { NextRequest, NextResponse } from "next/server";
import { ensureCurrentProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";
import { RECRUITMENT_POST_TTL_DAYS } from "@/lib/recruitment-storage";

/** Lista anúncios de recrutamento ativos */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recruitment_posts")
      .select("id,user_id,author_nick,game,message,expires_at,created_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, posts: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao listar anuncios." },
      { status: 500 }
    );
  }
}

/** Cria um anúncio de recrutamento */
export async function POST(request: NextRequest) {
  try {
    const profile = await ensureCurrentProfile();
    if (!profile?.id) {
      return NextResponse.json({ ok: false, message: "Faca login para publicar anuncio." }, { status: 401 });
    }

    const body = (await request.json()) as { game?: string; message?: string };
    const game = typeof body.game === "string" ? body.game.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!game || !message) {
      return NextResponse.json({ ok: false, message: "Jogo e mensagem sao obrigatorios." }, { status: 400 });
    }

    if (message.length > 280) {
      return NextResponse.json({ ok: false, message: "Mensagem deve ter no maximo 280 caracteres." }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + RECRUITMENT_POST_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recruitment_posts")
      .insert({
        user_id: profile.id,
        author_nick: profile.gamertag,
        game,
        message,
        expires_at: expiresAt
      })
      .select("id,user_id,author_nick,game,message,expires_at,created_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao publicar anuncio." },
      { status: 500 }
    );
  }
}
