import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { ensureCurrentProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

function normalizeNickname(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const access = await getServerAdminAccess();
    if (!access.canAccess) {
      return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
    }

    await ensureCurrentProfile();

    const { id } = await params;
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id,full_name,email,gamertag,cpf,whatsapp,platform,created_at,updated_at,status,penalty_reason,is_admin"
      )
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { ok: false, message: profileError?.message ?? "Usuario nao encontrado." },
        { status: profileError ? 500 : 404 }
      );
    }

    const nickname = normalizeNickname(profile.gamertag);

    const [
      labelsResult,
      walletResult,
      registrationsResult,
      purchasesResult,
      withdrawalsResult,
      registrationsCountResult,
      purchasesCountResult,
      withdrawalsCountResult
    ] = await Promise.allSettled([
      supabase
        .from("user_labels")
        .select("label_id, crm_labels(id,name,color)")
        .eq("user_id", id),
      nickname
        ? supabase.from("wallets").select("nickname,balance,updated_at").eq("nickname", nickname).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      nickname
        ? supabase
            .from("tournament_registrations")
            .select("tournament_id,nickname,team_name,platform,whatsapp,payment_method,payment_status,created_at")
            .ilike("nickname", nickname)
            .order("created_at", { ascending: false })
            .limit(6)
        : Promise.resolve({ data: [], error: null }),
      nickname
        ? supabase
            .from("ppc_purchases")
            .select("id,nickname,package_id,amount_ppc,amount_brl,status,created_at,updated_at")
            .eq("nickname", nickname)
            .order("created_at", { ascending: false })
            .limit(6)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("withdrawal_requests")
        .select("id,user_id,nickname,full_name,ppc_amount,brl_estimate,status,admin_note,created_at,processed_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(6),
      nickname
        ? supabase.from("tournament_registrations").select("tournament_id", { count: "exact", head: true }).ilike("nickname", nickname)
        : Promise.resolve({ count: 0, error: null }),
      nickname
        ? supabase.from("ppc_purchases").select("id", { count: "exact", head: true }).eq("nickname", nickname)
        : Promise.resolve({ count: 0, error: null }),
      supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("user_id", id)
    ]);

    const labels =
      labelsResult.status === "fulfilled" && !labelsResult.value.error
        ? (labelsResult.value.data ?? [])
            .map((row) => row.crm_labels)
            .filter(Boolean)
        : [];

    const wallet =
      walletResult.status === "fulfilled" && !walletResult.value.error ? walletResult.value.data ?? null : null;

    const registrations =
      registrationsResult.status === "fulfilled" && !registrationsResult.value.error
        ? registrationsResult.value.data ?? []
        : [];

    const purchases =
      purchasesResult.status === "fulfilled" && !purchasesResult.value.error ? purchasesResult.value.data ?? [] : [];

    const withdrawals =
      withdrawalsResult.status === "fulfilled" && !withdrawalsResult.value.error
        ? withdrawalsResult.value.data ?? []
        : [];

    const metrics = {
      registrations:
        registrationsCountResult.status === "fulfilled" && !registrationsCountResult.value.error
          ? registrationsCountResult.value.count ?? 0
          : null,
      purchases:
        purchasesCountResult.status === "fulfilled" && !purchasesCountResult.value.error
          ? purchasesCountResult.value.count ?? 0
          : null,
      withdrawals:
        withdrawalsCountResult.status === "fulfilled" && !withdrawalsCountResult.value.error
          ? withdrawalsCountResult.value.count ?? 0
          : null
    };

    return NextResponse.json({
      ok: true,
      detail: {
        profile,
        labels,
        wallet,
        registrations,
        purchases,
        withdrawals,
        metrics
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao carregar usuario." },
      { status: 500 }
    );
  }
}

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
