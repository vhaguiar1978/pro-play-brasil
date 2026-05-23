import { NextRequest, NextResponse } from "next/server";
import { ensureCurrentProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ tournamentId: string }> };

/** Retorna todas as inscrições de um campeonato */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { tournamentId } = await params;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tournament_registrations")
      .select("id,tournament_id,nickname,team_name,platform,payment_method,payment_status,created_at")
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, registrations: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao listar inscrições." },
      { status: 500 }
    );
  }
}

/** Inscreve o usuário autenticado em um campeonato gratuito */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const profile = await ensureCurrentProfile();
    if (!profile?.id) {
      return NextResponse.json({ ok: false, message: "Faca login para se inscrever." }, { status: 401 });
    }

    const { tournamentId } = await params;
    const body = (await request.json()) as {
      nickname?: string;
      teamName?: string;
      platform?: string;
      whatsapp?: string;
    };

    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : profile.gamertag;
    const teamName = typeof body.teamName === "string" ? body.teamName.trim() : "";
    const platform = typeof body.platform === "string" ? body.platform.trim() : profile.platform;
    const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : profile.whatsapp;

    if (!nickname || !platform || !whatsapp) {
      return NextResponse.json({ ok: false, message: "Nickname, plataforma e WhatsApp sao obrigatorios." }, { status: 400 });
    }

    const supabase = await createClient();

    // Verifica duplicidade
    const { data: existing } = await supabase
      .from("tournament_registrations")
      .select("id")
      .eq("user_id", profile.id)
      .eq("tournament_id", tournamentId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: false, message: "Voce ja esta inscrito neste campeonato." }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("tournament_registrations")
      .insert({
        user_id: profile.id,
        tournament_id: tournamentId,
        nickname,
        team_name: teamName,
        platform,
        whatsapp,
        payment_method: "free",
        payment_status: "free"
      })
      .select("id,tournament_id,nickname,team_name,platform,payment_method,payment_status,created_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, registration: data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao registrar inscrição." },
      { status: 500 }
    );
  }
}
