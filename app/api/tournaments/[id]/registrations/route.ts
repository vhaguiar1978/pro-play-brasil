import { NextResponse } from "next/server";
import {
  addRegistration,
  countRegistrations,
  readRegistrationsByTournament,
  type ServerRegistration
} from "@/lib/tournament-registrations-server-storage";
import { getServerTournamentById } from "@/lib/tournaments-server-storage";
import { MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";
import { generateBracket, readAllMatches, type BracketFormat } from "@/lib/match-storage";
import { checkRateLimit, rateLimitResponse, readClientIp } from "@/lib/rate-limit";

// GET /api/tournaments/[id]/registrations
// Lista pública (sem dados sensíveis: oculta WhatsApp).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const all = await readRegistrationsByTournament(id);
  const publicView = all.map((r) => ({
    tournamentId: r.tournamentId,
    nickname: r.nickname,
    teamName: r.teamName,
    platform: r.platform,
    paymentStatus: r.paymentStatus,
    createdAt: r.createdAt
  }));
  return NextResponse.json({ registrations: publicView, count: all.length });
}

// POST /api/tournaments/[id]/registrations
// Inscrição pública. Quando atinge maxPlayers, dispara generateBracket automaticamente.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limit: 5 inscrições por IP a cada 10min
  const ip = readClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, { limit: 5, windowSec: 600 });
  const rlResp = rateLimitResponse(rl);
  if (rlResp) return rlResp;

  const tournament =
    (await getServerTournamentById(id)) ?? MOCK_TOURNAMENTS.find((t) => t.id === id);
  if (!tournament) {
    return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
  }
  if (tournament.status !== "open") {
    return NextResponse.json(
      { error: "Inscrições encerradas para este campeonato" },
      { status: 400 }
    );
  }

  let body: {
    nickname?: string;
    teamName?: string;
    platform?: string;
    whatsapp?: string;
    paymentMethod?: ServerRegistration["paymentMethod"];
    paymentStatus?: ServerRegistration["paymentStatus"];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Bloqueia se já bateu o limite (proteção contra corrida)
  const current = await countRegistrations(id);
  if (current >= tournament.maxPlayers) {
    return NextResponse.json(
      { error: "Vagas esgotadas — chaveamento já está completo" },
      { status: 400 }
    );
  }

  const result = await addRegistration({
    tournamentId: id,
    nickname: String(body.nickname ?? ""),
    teamName: typeof body.teamName === "string" ? body.teamName : undefined,
    platform: String(body.platform ?? tournament.platform ?? ""),
    whatsapp: String(body.whatsapp ?? ""),
    paymentMethod: body.paymentMethod,
    paymentStatus: body.paymentStatus
  });
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  // ─── AUTO-BRACKET ───
  // Se a inscrição atingiu o limite, gera o chaveamento automaticamente.
  // Só gera se ainda não existir bracket pra esse campeonato.
  const newCount = current + 1;
  let bracketGenerated = false;
  if (newCount >= tournament.maxPlayers) {
    const existing = await readAllMatches(id);
    if (existing.length === 0) {
      const all = await readRegistrationsByTournament(id);
      const participants = all.map((r) => ({
        nickname: r.nickname,
        teamName: r.teamName || undefined,
        whatsapp: r.whatsapp || undefined
      }));
      try {
        await generateBracket({
          tournamentId: id,
          participants,
          format: tournament.format as BracketFormat
        });
        bracketGenerated = true;
      } catch (err) {
        console.warn(`[registrations] auto-bracket falhou:`, err);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    registration: {
      tournamentId: result.tournamentId,
      nickname: result.nickname,
      teamName: result.teamName,
      platform: result.platform,
      paymentStatus: result.paymentStatus,
      createdAt: result.createdAt
    },
    count: newCount,
    bracketGenerated
  });
}
