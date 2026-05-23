import { NextResponse } from "next/server";
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
      .from("profiles")
      .select(
        "id,full_name,email,gamertag,cpf,whatsapp,platform,created_at,updated_at,status,penalty_reason,is_admin"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, users: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao listar usuarios." },
      { status: 500 }
    );
  }
}
