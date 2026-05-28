import "server-only";

import { MercadoPagoCheckoutPayload } from "@/lib/payments";
import { getSiteUrl } from "@/lib/site-url";

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type MercadoPagoPaymentResponse = {
  id?: number | string;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_type_id?: string;
  date_created?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type MercadoPagoSearchResponse = {
  results?: MercadoPagoPaymentResponse[];
};

function resolveAppUrl() {
  return getSiteUrl();
}

function readAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ?? "";
}

export function isMercadoPagoConfigured() {
  return Boolean(readAccessToken());
}

export async function createMercadoPagoPreference(payload: MercadoPagoCheckoutPayload) {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new Error("Mercado Pago ainda nao configurado no ambiente.");
  }

  const appUrl = resolveAppUrl();
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID()
    },
    body: JSON.stringify({
      items: [
        {
          title: payload.title,
          description: payload.description,
          quantity: payload.quantity,
          unit_price: payload.unitPrice,
          currency_id: "BRL"
        }
      ],
      external_reference: payload.externalReference.slice(0, 64),
      statement_descriptor: "PROPLAYBR",
      auto_return: "approved",
      back_urls: {
        success: `${appUrl}/pagamentos/retorno?status=success`,
        failure: `${appUrl}/pagamentos/retorno?status=failure`,
        pending: `${appUrl}/pagamentos/retorno?status=pending`
      },
      notification_url: `${appUrl}/api/payments/mercado-pago/webhook`,
      metadata: payload.metadata ?? {}
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago retornou erro ao criar o checkout: ${text}`);
  }

  const data = (await response.json()) as MercadoPagoPreferenceResponse;
  const checkoutUrl = data.init_point ?? data.sandbox_init_point;

  if (!checkoutUrl) {
    throw new Error("Mercado Pago nao devolveu a URL do checkout.");
  }

  return {
    preferenceId: data.id ?? "",
    checkoutUrl
  };
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new Error("Mercado Pago ainda nao configurado no ambiente.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago retornou erro ao consultar o pagamento: ${text}`);
  }

  return (await response.json()) as MercadoPagoPaymentResponse;
}

export async function searchMercadoPagoPayments(limit = 12) {
  const accessToken = readAccessToken();

  if (!accessToken) {
    return [] as MercadoPagoPaymentResponse[];
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago retornou erro ao listar pagamentos: ${text}`);
  }

  const data = (await response.json()) as MercadoPagoSearchResponse;
  return Array.isArray(data.results) ? data.results : [];
}
