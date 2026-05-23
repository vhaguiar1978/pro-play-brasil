import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { ensureCurrentProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const access = await getServerAdminAccess();
    if (!access.canAccess) {
      return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
    }

    await ensureCurrentProfile();

    const body = (await request.json()) as { reply?: string };
    const reply = typeof body.reply === "string" ? body.reply.trim() : "";
    if (!reply) {
      return NextResponse.json({ ok: false, message: "Resposta obrigatoria." }, { status: 400 });
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("complaints")
      .update({ admin_reply: reply, status: "respondida" })
      .eq("id", id)
      .select("id,status,admin_reply,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, complaint: data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao responder reclamacao." },
      { status: 500 }
    );
  }
}
