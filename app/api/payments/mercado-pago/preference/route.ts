import { NextResponse } from "next/server";
import { createMercadoPagoPreference } from "@/lib/mercado-pago";
import { MercadoPagoCheckoutPayload } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()) {
      return NextResponse.json(
        { error: "Mercado Pago ainda nao configurado. Adicione MERCADO_PAGO_ACCESS_TOKEN na Vercel." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: "Faca login antes de abrir o checkout real do Mercado Pago." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as Partial<MercadoPagoCheckoutPayload>;

    if (
      !payload ||
      typeof payload.title !== "string" ||
      typeof payload.description !== "string" ||
      typeof payload.quantity !== "number" ||
      typeof payload.unitPrice !== "number" ||
      typeof payload.externalReference !== "string" ||
      typeof payload.kind !== "string"
    ) {
      return NextResponse.json({ error: "Payload de checkout invalido." }, { status: 400 });
    }

    const result = await createMercadoPagoPreference({
      ...(payload as MercadoPagoCheckoutPayload),
      metadata: {
        ...(payload.metadata ?? {}),
        kind: payload.kind,
        user_id: user.id,
        user_email: user.email
      }
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao preparar checkout do Mercado Pago.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
