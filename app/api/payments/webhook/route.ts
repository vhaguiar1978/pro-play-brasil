import { NextResponse } from "next/server";
import { fetchMercadoPagoPayment, isMercadoPagoConfigured } from "@/lib/mercado-pago";
import {
  getPurchaseById,
  markPurchaseApproved,
  markPurchaseStatus
} from "@/lib/ppc-purchases-server-storage";
import { credit } from "@/lib/wallet-server-storage";
import { getPackageById, totalPpc } from "@/lib/ppc-packages";

// POST /api/payments/webhook
// Recebe notificações do Mercado Pago. Sempre retorna 200 (mesmo em erro)
// pra evitar reenvio infinito. Idempotente — não credita duas vezes.
//
// Fluxo:
//  1. MP envia { type: "payment", data: { id } }
//  2. Buscamos o payment no MP pra validar status real (nunca confiar no payload)
//  3. Se approved → buscamos a purchase pelo external_reference
//  4. Validamos amount cobrado vs pacote (anti-fraude)
//  5. Marca purchase como approved + credita PPC + insere ledger (atomic via credit())
//  6. Idempotência: se purchase já está "approved", skip silenciosamente

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  // Wrapper try/catch externo pra SEMPRE responder 200 (regra do MP)
  try {
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { received: true, note: "MP não configurado." },
        { status: 200 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const topic = readString(body.topic) || readString(body.type);
    const dataObj = body.data as Record<string, unknown> | undefined;
    const paymentId =
      readString(dataObj?.id) ||
      readString(body.id) ||
      (typeof dataObj?.id === "number" ? String(dataObj.id) : "");

    const isPaymentTopic =
      topic === "payment" || topic === "payment.created" || topic === "payment.updated";
    if (!isPaymentTopic || !paymentId) {
      return NextResponse.json({ received: true, skipped: true, topic });
    }

    // Busca o pagamento REAL no MP — não confia no que veio no body
    const payment = await fetchMercadoPagoPayment(paymentId);
    const status = readString(payment.status).toLowerCase();
    const purchaseId = readString(payment.external_reference);
    const transactionAmount =
      typeof payment.transaction_amount === "number" ? payment.transaction_amount : 0;

    if (!purchaseId) {
      return NextResponse.json({ received: true, note: "Sem external_reference no payment." });
    }

    const purchase = await getPurchaseById(purchaseId);
    if (!purchase) {
      return NextResponse.json({ received: true, note: `Purchase ${purchaseId} não encontrada.` });
    }

    // Idempotência: já processado
    if (purchase.status === "approved") {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // Status do MP que não é approved → registramos o estado pra histórico
    if (status !== "approved") {
      if (status === "rejected" || status === "cancelled") {
        await markPurchaseStatus(purchase.id, "rejected");
      } else if (status === "refunded" || status === "charged_back") {
        await markPurchaseStatus(purchase.id, "refunded");
      }
      return NextResponse.json({ received: true, status, note: "Pagamento não aprovado." });
    }

    // ─── ANTI-FRAUDE: valor cobrado precisa bater com o pacote ───
    const pkg = getPackageById(purchase.packageId);
    if (!pkg) {
      return NextResponse.json({
        received: true,
        warning: `Pacote ${purchase.packageId} não encontrado no catálogo atual.`
      });
    }
    if (Math.abs(transactionAmount - pkg.brl) > 0.01) {
      console.error(
        `[mp-webhook] amount mismatch! Purchase ${purchaseId} esperava R$ ${pkg.brl}, MP cobrou R$ ${transactionAmount}`
      );
      return NextResponse.json({
        received: true,
        warning: "Valor cobrado não bate com o pacote — não creditado, verificar manualmente."
      });
    }

    // ─── CRÉDITO ATÔMICO ───
    // 1. Marca purchase como approved
    const updated = await markPurchaseApproved(purchase.id, String(payment.id ?? paymentId));
    // 2. Credita PPC + insere ledger (lib server-only, transactional)
    const expectedPpc = totalPpc(pkg);
    await credit({
      nickname: purchase.nickname,
      amount: expectedPpc,
      type: "purchase",
      source: `mp:${payment.id ?? paymentId}`,
      note: `Compra do pacote ${pkg.id} (${expectedPpc} PPC por R$ ${pkg.brl.toFixed(2)})`
    });

    return NextResponse.json({
      received: true,
      credited: expectedPpc,
      purchaseId: purchase.id,
      nickname: purchase.nickname,
      status: updated?.status ?? "approved"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno no webhook.";
    console.error("[mp-webhook] erro:", message);
    // Mesmo em erro, retorna 200 pro MP não reenviar
    return NextResponse.json({ received: true, error: message }, { status: 200 });
  }
}
