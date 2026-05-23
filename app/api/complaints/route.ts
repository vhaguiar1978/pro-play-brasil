import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { ensureCurrentProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const access = await getServerAdminAccess();
    if (!access.canAccess) {
      return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
    }

    await ensureCurrentProfile();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("complaints")
      .select("id,nickname,full_name,email,subject,message,status,admin_reply,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, complaints: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao listar reclamacoes." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await ensureCurrentProfile();
    if (!profile) {
      return NextResponse.json({ ok: false, message: "Faca login para enviar uma reclamacao." }, { status: 401 });
    }

    const body = (await request.json()) as {
      pagePath?: string;
      subject?: string;
      message?: string;
      contact?: string;
    };

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!subject || !message) {
      return NextResponse.json({ ok: false, message: "Assunto e mensagem sao obrigatorios." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("complaints")
      .insert({
        user_id: profile.id,
        nickname: profile.gamertag,
        full_name: profile.full_name,
        email: profile.email,
        subject: `[${typeof body.pagePath === "string" ? body.pagePath : "/"}] ${subject}`,
        message: typeof body.contact === "string" && body.contact.trim() ? `${message}\n\nContato: ${body.contact.trim()}` : message
      })
      .select("id,nickname,full_name,email,subject,message,status,admin_reply,created_at,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, complaint: data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao enviar reclamacao." },
      { status: 500 }
    );
  }
}
