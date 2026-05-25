import { NextResponse } from "next/server";
import { sweepExpiredAutoConfirms } from "@/lib/match-storage";

// Cron job: finaliza partidas pendentes que passaram do prazo de auto-confirmação.
// Vercel chama esse endpoint conforme `vercel.json > crons` (config a cada 2min).
//
// Proteção:
// - Vercel adiciona automaticamente o header `Authorization: Bearer <CRON_SECRET>`
//   nos crons configurados (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
// - Em dev / chamada manual, basta `?key=<CRON_SECRET>` ou sem nenhuma proteção
//   se CRON_SECRET não estiver setado (modo experiência).

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem secret configurado, libera (modo dev)
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("key") === secret) return true;
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const { processed } = await sweepExpiredAutoConfirms();
    return NextResponse.json({
      ok: true,
      processed,
      at: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no sweep" },
      { status: 500 }
    );
  }
}

// POST aceita o mesmo trabalho — algumas integrações preferem POST pra crons.
export const POST = GET;
