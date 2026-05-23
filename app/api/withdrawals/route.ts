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
      .from("withdrawal_requests")
      .select("id,user_id,nickname,full_name,ppc_amount,brl_estimate,pix_key,contact,status,admin_note,created_at,processed_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, requests: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao listar saques." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await ensureCurrentProfile();
    if (!profile?.id) {
      return NextResponse.json({ ok: false, message: "Faca login para solicitar saque." }, { status: 401 });
    }

    const body = (await request.json()) as {
      ppcAmount?: number;
      brlEstimate?: number;
      pixKey?: string;
      contact?: string;
    };

    const ppcAmount = typeof body.ppcAmount === "number" ? body.ppcAmount : 0;
    const brlEstimate = typeof body.brlEstimate === "number" ? body.brlEstimate : 0;
    const pixKey = typeof body.pixKey === "string" ? body.pixKey.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";

    if (!ppcAmount || ppcAmount <= 0) {
      return NextResponse.json({ ok: false, message: "Valor de saque invalido." }, { status: 400 });
    }

    if (!pixKey) {
      return NextResponse.json({ ok: false, message: "Chave Pix obrigatoria." }, { status: 400 });
    }

    if (!contact) {
      return NextResponse.json({ ok: false, message: "Contato obrigatorio." }, { status: 400 });
    }

    const supabase = await createClient();

    // Registra o saque na tabela
    const { data: withdrawal, error: withdrawError } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: profile.id,
        nickname: profile.gamertag,
        full_name: profile.full_name || profile.gamertag,
        ppc_amount: ppcAmount,
        brl_estimate: brlEstimate,
        pix_key: pixKey,
        contact,
        status: "pendente"
      })
      .select("id,user_id,nickname,full_name,ppc_amount,brl_estimate,pix_key,contact,status,admin_note,created_at,processed_at")
      .single();

    if (withdrawError) {
      return NextResponse.json({ ok: false, message: withdrawError.message }, { status: 500 });
    }

    // Registra a saída no ledger de PPC
    await supabase.from("ppc_ledger").insert({
      user_id: profile.id,
      type: "withdraw_request",
      amount: ppcAmount,
      direction: "out",
      source: withdrawal.id,
      note: `Pedido de saque de ${ppcAmount} PPC`
    });

    return NextResponse.json({ ok: true, request: withdrawal });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao registrar saque." },
      { status: 500 }
    );
  }
}
