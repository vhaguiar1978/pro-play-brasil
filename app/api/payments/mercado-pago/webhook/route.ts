import { NextRequest, NextResponse } from "next/server";
import { fetchMercadoPagoPayment } from "@/lib/mercado-pago";
import { createClient } from "@/lib/supabase/server";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Webhook do Mercado Pago — notificação assíncrona de pagamentos.
 * MP envia POST com topic=payment e data.id contendo o ID do pagamento.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/notifications/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()) {
      return NextResponse.json({ received: true, note: "MP nao configurado." }, { status: 200 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    // Formato moderno: { action, api_version, data: { id }, type }
    // Formato legado: { topic, id }
    const topic = readString(body.topic) || readString(body.type);
    const dataId = (body.data as Record<string, unknown> | undefined)?.id;
    const paymentId =
      readString(dataId) ||
      readString(body.id) ||
      (typeof dataId === "number" ? String(dataId) : "");

    if ((topic !== "payment" && topic !== "payment.created" && topic !== "payment.updated") || !paymentId) {
      // Outras notificações (merchant_orders, chargebacks) apenas confirmamos recebimento
      return NextResponse.json({ received: true, skipped: true });
    }

    const payment = await fetchMercadoPagoPayment(paymentId);
    const status = readString(payment.status).toLowerCase();

    if (status !== "approved") {
      return NextResponse.json({ received: true, status, note: "Pagamento ainda nao aprovado." });
    }

    const metadata = payment.metadata ?? {};
    const kind = readString(metadata.kind);
    const resolvedPaymentId = String(payment.id ?? paymentId);
    const source = `mercado-pago:${resolvedPaymentId}`;
    const userId = readString(metadata.user_id);

    if (!userId) {
      return NextResponse.json({ received: true, note: "Sem user_id no metadata do pagamento." });
    }

    const supabase = await createClient();

    if (kind === "ppc_purchase") {
      const coins = readNumber(metadata.coins);
      if (!coins) {
        return NextResponse.json({ received: true, note: "Sem quantidade de PPC no metadata." });
      }

      // Verifica idempotência: não credita duas vezes
      const { data: existing } = await supabase
        .from("ppc_ledger")
        .select("id")
        .eq("user_id", userId)
        .eq("source", source)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        await supabase.from("ppc_ledger").insert({
          user_id: userId,
          type: "purchase",
          amount: coins,
          direction: "in",
          source,
          note: `Compra aprovada via Mercado Pago - webhook (${coins} PPC)`
        });
      }

      return NextResponse.json({ received: true, kind, coins, alreadyProcessed: Boolean(existing) });
    }

    if (kind === "tournament_fee") {
      const tournamentId = readString(metadata.tournament_id);
      const nickname = readString(metadata.nickname);
      const teamName = readString(metadata.team_name);
      const platform = readString(metadata.platform);
      const whatsapp = readString(metadata.whatsapp);

      if (!tournamentId || !nickname || !platform || !whatsapp) {
        return NextResponse.json({ received: true, note: "Dados insuficientes de inscrição no metadata." });
      }

      const { data: existing } = await supabase
        .from("tournament_registrations")
        .select("id")
        .eq("user_id", userId)
        .eq("tournament_id", tournamentId)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        await supabase.from("tournament_registrations").insert({
          user_id: userId,
          tournament_id: tournamentId,
          nickname,
          team_name: teamName,
          platform,
          whatsapp,
          payment_method: "mercado_pago",
          payment_status: "paid"
        });
      }

      return NextResponse.json({ received: true, kind, alreadyProcessed: Boolean(existing) });
    }

    return NextResponse.json({ received: true, kind, note: "Tipo de operacao nao reconhecido." });
  } catch (error) {
    // Sempre retorna 200 para o MP não reenviar indefinidamente
    const message = error instanceof Error ? error.message : "Erro interno no webhook.";
    console.error("[MP Webhook]", message);
    return NextResponse.json({ received: true, error: message }, { status: 200 });
  }
}
