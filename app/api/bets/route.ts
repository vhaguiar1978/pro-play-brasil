import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { placeBet, getBetsForMatch, MIN_STAKE, MAX_STAKE } from "@/lib/betting-server-storage";
import { checkRateLimit, rateLimitResponse, readClientIp } from "@/lib/rate-limit";

// POST /api/bets
// Body: { matchId, side: "A"|"B", stake: number }
// Coloca uma aposta. Anti-trapaça + anti-fraude rodam dentro de placeBet().
//
// GET /api/bets?matchId=...
// Lista as apostas de uma partida (público — qualquer um vê as odds).

function readGamertagFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const v = (metadata as { gamertag?: unknown }).gamertag;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function POST(request: Request) {
  // Rate limit: 20 apostas/min por IP (gente normal aposta 1-2x; spam = bot)
  const ip = readClientIp(request);
  const rl = checkRateLimit(`bet:${ip}`, { limit: 20, windowSec: 60 });
  const rlResp = rateLimitResponse(rl);
  if (rlResp) return rlResp;

  // Auth obrigatório
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Faça login pra apostar" }, { status: 401 });
  }
  const gamertag = readGamertagFromMetadata(user.user_metadata);
  if (!gamertag) {
    return NextResponse.json(
      { error: "Defina seu gamertag no perfil antes de apostar" },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    matchId?: string;
    side?: string;
    stake?: number;
  };
  if (!body.matchId || (body.side !== "A" && body.side !== "B")) {
    return NextResponse.json(
      { error: "Parâmetros inválidos (matchId + side A|B + stake)" },
      { status: 400 }
    );
  }
  const stake = Number(body.stake);
  if (!Number.isFinite(stake)) {
    return NextResponse.json(
      { error: `Stake inválido (faixa permitida: ${MIN_STAKE}-${MAX_STAKE} PPC)` },
      { status: 400 }
    );
  }

  const result = await placeBet({
    nick: gamertag,
    matchId: body.matchId,
    side: body.side,
    stake,
    ip
  });

  if (!result.ok) {
    // Hard blocks anti-trapaça → 403; saldo → 402; outros → 400
    const status =
      result.code === "is_player" ||
      result.code === "is_active_in_tournament" ||
      result.code === "match_locked"
        ? 403
        : result.code === "insufficient_balance"
          ? 402
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    bet: result.bet,
    flagged: result.bet.flagged,
    flagCount: result.flags.length,
    // Não vaza detalhes das flags pro usuário (evita engenharia reversa
    // das heurísticas anti-fraude). Só sinaliza que houve hold.
    note: result.bet.flagged
      ? "Aposta aceita, mas o payout fica retido até revisão da nossa equipe."
      : "Aposta registrada."
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchId = url.searchParams.get("matchId")?.trim();
  if (!matchId) {
    return NextResponse.json({ error: "matchId é obrigatório" }, { status: 400 });
  }
  try {
    const bets = await getBetsForMatch(matchId);
    // Resumo do pool (não vaza nicks de apostadores na resposta pública)
    const sideA = bets.filter((b) => b.side === "A" && b.status !== "void");
    const sideB = bets.filter((b) => b.side === "B" && b.status !== "void");
    const stakeA = sideA.reduce((sum, b) => sum + b.stake, 0);
    const stakeB = sideB.reduce((sum, b) => sum + b.stake, 0);
    const totalPool = stakeA + stakeB;

    return NextResponse.json({
      matchId,
      totalPool,
      sideA: { count: sideA.length, stake: stakeA },
      sideB: { count: sideB.length, stake: stakeB },
      // Odds simples = (totalPool / stakeLado). 1.0 = empate; >1.0 = lado underdog
      oddsA: stakeA > 0 ? Number((totalPool / stakeA).toFixed(2)) : null,
      oddsB: stakeB > 0 ? Number((totalPool / stakeB).toFixed(2)) : null
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
