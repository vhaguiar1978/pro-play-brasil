import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ nickname: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { nickname } = await params;
    const cleanNick = decodeURIComponent(nickname).trim();

    if (!cleanNick) {
      return NextResponse.json({ ok: false, message: "Nickname invalido." }, { status: 400 });
    }

    const supabase = await createClient();

    // Busca o perfil pelo gamertag (case-insensitive via ilike)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,gamertag,city,state,status")
      .ilike("gamertag", cleanNick)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ ok: false, message: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ ok: true, history: [], registrations: [] });
    }

    // Histórico de partidas registradas no banco
    const { data: history, error: historyError } = await supabase
      .from("player_history")
      .select("id,tournament_id,tournament_name,played_at,round_label,result_label,campaign_label,created_at")
      .eq("user_id", profile.id)
      .order("played_at", { ascending: false })
      .limit(50);

    if (historyError) {
      return NextResponse.json({ ok: false, message: historyError.message }, { status: 500 });
    }

    // Inscrições em campeonatos (mostra participação mesmo sem resultado)
    const { data: registrations, error: regError } = await supabase
      .from("tournament_registrations")
      .select("id,tournament_id,nickname,team_name,platform,payment_status,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (regError) {
      return NextResponse.json({ ok: false, message: regError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        gamertag: profile.gamertag,
        city: profile.city || null,
        state: profile.state || null,
        status: profile.status
      },
      history: history ?? [],
      registrations: registrations ?? []
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao buscar historico." },
      { status: 500 }
    );
  }
}
