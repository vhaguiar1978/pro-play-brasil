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

    const profile = await ensureCurrentProfile();
    if (!profile?.id) {
      return NextResponse.json({ ok: false, message: "Nao autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as { status?: string; adminNote?: string };
    const status = body.status === "pago" || body.status === "recusado" ? body.status : null;
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";

    if (!status) {
      return NextResponse.json({ ok: false, message: "Status deve ser 'pago' ou 'recusado'." }, { status: 400 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Busca o pedido atual
    const { data: existing, error: findError } = await supabase
      .from("withdrawal_requests")
      .select("id,user_id,ppc_amount,status")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ ok: false, message: "Pedido de saque nao encontrado." }, { status: 404 });
    }

    if (existing.status !== "pendente") {
      return NextResponse.json({ ok: false, message: "Pedido ja foi processado." }, { status: 409 });
    }

    // Atualiza o status do saque
    const { data: updated, error: updateError } = await supabase
      .from("withdrawal_requests")
      .update({
        status,
        admin_note: adminNote,
        processed_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("id,user_id,nickname,full_name,ppc_amount,brl_estimate,pix_key,contact,status,admin_note,created_at,processed_at")
      .single();

    if (updateError) {
      return NextResponse.json({ ok: false, message: updateError.message }, { status: 500 });
    }

    // Se recusado, estorna o PPC no ledger
    if (status === "recusado") {
      await supabase.from("ppc_ledger").insert({
        user_id: existing.user_id,
        type: "withdraw_refund",
        amount: existing.ppc_amount,
        direction: "in",
        source: id,
        note: "Saque recusado com estorno em PPC"
      });
    } else {
      // Se pago, registra a saída definitiva no ledger
      await supabase.from("ppc_ledger").insert({
        user_id: existing.user_id,
        type: "withdraw_paid",
        amount: existing.ppc_amount,
        direction: "out",
        source: id,
        note: "Saque pago pelo admin"
      });
    }

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao processar saque." },
      { status: 500 }
    );
  }
}
