import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import {
  deleteServerTournament,
  getServerTournamentById,
  updateServerTournament
} from "@/lib/tournaments-server-storage";
import { deleteMatchesByTournament, readAllMatches } from "@/lib/match-storage";
import {
  deleteRegistrationsByTournament,
  readRegistrationsByTournament
} from "@/lib/tournament-registrations-server-storage";

function formatDuration(from: string, to: string) {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

  const totalMinutes = Math.round((end - start) / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}min`);

  return parts.length > 0 ? parts.join(" ") : "menos de 1min";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const tournament = await getServerTournamentById(id);

  if (!tournament) {
    return NextResponse.json({ error: "Campeonato nao encontrado" }, { status: 404 });
  }

  const [registrations, matches] = await Promise.all([
    readRegistrationsByTournament(id),
    readAllMatches(id)
  ]);

  const playableMatches = matches.filter((match) => Boolean(match.playerA || match.playerB));
  const finalizedMatches = playableMatches.filter((match) => match.status === "finalized");

  const championMatch =
    [...finalizedMatches]
      .sort((a, b) => {
        const aFinal = a.finalizedAt ? new Date(a.finalizedAt).getTime() : 0;
        const bFinal = b.finalizedAt ? new Date(b.finalizedAt).getTime() : 0;
        return bFinal - aFinal || b.round - a.round || b.matchNumber - a.matchNumber;
      })
      .find((match) => match.winner && !match.nextMatchId) ??
    [...finalizedMatches]
      .sort((a, b) => {
        const aFinal = a.finalizedAt ? new Date(a.finalizedAt).getTime() : 0;
        const bFinal = b.finalizedAt ? new Date(b.finalizedAt).getTime() : 0;
        return bFinal - aFinal;
      })[0];

  const champion =
    championMatch?.winner === "A"
      ? championMatch.playerA
      : championMatch?.winner === "B"
        ? championMatch.playerB
        : null;

  const latestFinalizedAt =
    finalizedMatches
      .map((match) => match.finalizedAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  return NextResponse.json({
    tournament,
    detail: {
      registrations,
      matches,
      metrics: {
        registrations: registrations.length,
        matches: playableMatches.length,
        finalizedMatches: finalizedMatches.length,
        completionRate:
          playableMatches.length > 0
            ? Math.round((finalizedMatches.length / playableMatches.length) * 100)
            : 0
      },
      champion: champion
        ? {
            nickname: champion.nickname,
            teamName: champion.teamName ?? null
          }
        : null,
      duration: {
        startedAt: tournament.startDate,
        finishedAt: latestFinalizedAt,
        label: latestFinalizedAt ? formatDuration(tournament.startDate, latestFinalizedAt) : null
      }
    }
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const raw = await request.json().catch(() => null);
  const result = await updateServerTournament(id, raw);

  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, tournament: result });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  await deleteMatchesByTournament(id);
  await deleteRegistrationsByTournament(id);
  await deleteServerTournament(id);

  return NextResponse.json({ ok: true });
}
