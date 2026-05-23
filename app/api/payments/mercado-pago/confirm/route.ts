import { NextResponse } from "next/server";
import { fetchMercadoPagoPayment } from "@/lib/mercado-pago";
import { ensureCurrentUserLedgerEntry } from "@/lib/ppc-ledger-server";
import { ensureCurrentProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizePaymentId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

export async function POST(request: Request) {
  try {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()) {
      return NextResponse.json({ ok: false, message: "Mercado Pago ainda nao configurado." }, { status: 503 });
    }

    const body = (await request.json()) as {
      paymentId?: string;
      collectionId?: string;
    };

    const paymentId = readString(body.paymentId) || readString(body.collectionId);
    if (!paymentId) {
      return NextResponse.json({ ok: false, message: "ID do pagamento nao informado." }, { status: 400 });
    }

    const profile = await ensureCurrentProfile();
    if (!profile?.id) {
      return NextResponse.json({ ok: false, message: "Usuario nao autenticado." }, { status: 401 });
    }

    const payment = await fetchMercadoPagoPayment(paymentId);
    const status = readString(payment.status).toLowerCase();

    if (status !== "approved") {
      return NextResponse.json(
        {
          ok: false,
          status,
          message:
            status === "pending"
              ? "O Mercado Pago ainda esta processando o pagamento."
              : "O pagamento ainda nao foi aprovado no gateway."
        },
        { status: 409 }
      );
    }

    const metadata = payment.metadata ?? {};
    const kind = readString(metadata.kind);
    const resolvedPaymentId = normalizePaymentId(payment.id) || paymentId;
    const source = `mercado-pago:${resolvedPaymentId}`;

    if (kind === "ppc_purchase") {
      const coins = readNumber(metadata.coins);

      if (!coins) {
        return NextResponse.json({ ok: false, message: "Pagamento aprovado sem quantidade de PPC." }, { status: 400 });
      }

      const result = await ensureCurrentUserLedgerEntry({
        type: "purchase",
        amount: coins,
        direction: "in",
        source,
        note: `Compra aprovada via Mercado Pago (${coins} PPC)`
      });

      return NextResponse.json({
        ok: true,
        status,
        kind,
        paymentId: resolvedPaymentId,
        source,
        coins,
        alreadyProcessed: result.alreadyProcessed
      });
    }

    if (kind === "tournament_fee") {
      const tournamentId = readString(metadata.tournament_id);
      const nickname = readString(metadata.nickname) || profile.gamertag;
      const teamName = readString(metadata.team_name);
      const platform = readString(metadata.platform) || profile.platform;
      const whatsapp = readString(metadata.whatsapp) || profile.whatsapp;

      if (!tournamentId || !nickname || !platform || !whatsapp) {
        return NextResponse.json(
          { ok: false, message: "Pagamento aprovado sem dados suficientes da inscricao." },
          { status: 400 }
        );
      }

      const supabase = await createClient();
      const { data: existing, error: findError } = await supabase
        .from("tournament_registrations")
        .select("id")
        .eq("user_id", profile.id)
        .eq("tournament_id", tournamentId)
        .limit(1)
        .maybeSingle();

      if (findError) {
        throw new Error(findError.message);
      }

      if (!existing) {
        const { error: insertError } = await supabase.from("tournament_registrations").insert({
          user_id: profile.id,
          tournament_id: tournamentId,
          nickname,
          team_name: teamName,
          platform,
          whatsapp,
          payment_method: "mercado_pago",
          payment_status: "paid"
        });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      return NextResponse.json({
        ok: true,
        status,
        kind,
        paymentId: resolvedPaymentId,
        source,
        registration: {
          tournamentId,
          nickname,
          teamName,
          platform,
          whatsapp,
          paymentMethod: "mercado_pago",
          paymentStatus: "paid",
          createdAt: payment.date_created || new Date().toISOString()
        },
        alreadyProcessed: Boolean(existing)
      });
    }

    return NextResponse.json(
      { ok: false, message: "Pagamento aprovado, mas o tipo dessa operacao nao foi reconhecido." },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao confirmar pagamento do Mercado Pago.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
