import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMercadoPagoConfigured, createMercadoPagoPreference } from "@/lib/mercado-pago";
import { createPurchase, setPreferenceId } from "@/lib/ppc-purchases-server-storage";
import { PPC_PACKAGES, getPackageById, totalPpc } from "@/lib/ppc-packages";
import { checkRateLimit, rateLimitResponse, readClientIp } from "@/lib/rate-limit";

// POST /api/payments/checkout
// Body: { packageId }
// Cria uma purchase em status pending + preference no Mercado Pago,
// retorna init_point pra UI redirecionar o usuário.

export async function POST(request: Request) {
  // Rate limit: 10 checkouts por IP em 10min (evita spam de preferences órfãs)
  const ip = readClientIp(request);
  const rl = checkRateLimit(`checkout:${ip}`, { limit: 10, windowSec: 600 });
  const rlResp = rateLimitResponse(rl);
  if (rlResp) return rlResp;

  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      {
        error: "Mercado Pago ainda não está configurado. Adicione MERCADO_PAGO_ACCESS_TOKEN nas envs.",
        availablePackages: PPC_PACKAGES
      },
      { status: 503 }
    );
  }

  // Autenticação obrigatória
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json(
      { error: "Faça login pra comprar PPC." },
      { status: 401 }
    );
  }
  const gamertag =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as { gamertag?: unknown }).gamertag
      : null;
  if (typeof gamertag !== "string" || !gamertag.trim()) {
    return NextResponse.json(
      { error: "Defina seu gamertag no perfil antes de comprar PPC." },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { packageId?: string };
  const pkg = body.packageId ? getPackageById(body.packageId) : null;
  if (!pkg) {
    return NextResponse.json({ error: "Pacote inválido" }, { status: 400 });
  }

  const amountPpc = totalPpc(pkg);

  // 1. Registra purchase como pending no nosso banco
  let purchase;
  try {
    purchase = await createPurchase({
      nickname: gamertag,
      packageId: pkg.id,
      amountPpc,
      amountBrl: pkg.brl
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Não foi possível criar a compra: ${err instanceof Error ? err.message : "erro"}` },
      { status: 500 }
    );
  }

  // 2. Cria preference no Mercado Pago com external_reference = purchase.id
  try {
    const result = await createMercadoPagoPreference({
      kind: "ppc_purchase",
      title: `Pro Play Brasil — ${pkg.ppc.toLocaleString("pt-BR")} PPC`,
      description: `Compra de ${amountPpc.toLocaleString("pt-BR")} PPC${pkg.bonusPpc ? ` (${pkg.bonusPpc} bônus)` : ""}`,
      quantity: 1,
      unitPrice: pkg.brl,
      externalReference: purchase.id,
      metadata: {
        purchase_id: purchase.id,
        package_id: pkg.id,
        nickname: gamertag,
        coins: amountPpc,
        user_id: user.id,
        user_email: user.email
      }
    });

    // 3. Salva o preferenceId pra rastreabilidade
    await setPreferenceId(purchase.id, result.preferenceId);

    return NextResponse.json({
      ok: true,
      purchaseId: purchase.id,
      init_point: result.checkoutUrl,
      preferenceId: result.preferenceId
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao criar checkout no Mercado Pago" },
      { status: 502 }
    );
  }
}
