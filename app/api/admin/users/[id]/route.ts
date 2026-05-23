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

    const { id } = await params;
    const body = (await request.json()) as { status?: string; penaltyReason?: string };
    const nextStatus = body.status === "penalized" || body.status === "banned" ? body.status : "active";
    const penaltyReason = typeof body.penaltyReason === "string" ? body.penaltyReason.trim() : "";

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: nextStatus, penalty_reason: penaltyReason })
      .eq("id", id)
      .select("id,status,penalty_reason")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao atualizar usuario." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const access = await getServerAdminAccess();
    if (!access.canAccess) {
      return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
    }

    const { id } = await params;

    const supabase = await createClient();

    // Remove related records first to avoid FK constraint errors
    await supabase.from("ppc_ledger").delete().eq("user_id", id);
    await supabase.from("ppc_wallets").delete().eq("user_id", id);
    await supabase.from("withdrawal_requests").delete().eq("user_id", id);
    await supabase.from("player_history").delete().eq("user_id", id);
    await supabase.from("tournament_registrations").delete().eq("user_id", id);

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao excluir usuario." },
      { status: 500 }
    );
  }
}
