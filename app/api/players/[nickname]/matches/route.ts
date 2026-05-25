import { NextResponse } from "next/server";
import { readAllMatches } from "@/lib/match-storage";

// GET /api/players/[nickname]/matches
// Retorna todas as partidas do jogador (A ou B), ordenadas por: pendentes primeiro, depois finalizadas.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params;
  const decoded = decodeURIComponent(nickname).trim().toLowerCase();
  if (!decoded) return NextResponse.json({ matches: [], stats: emptyStats() });

  const all = await readAllMatches();
  const mine = all.filter(
    (m) =>
      m.playerA?.nickname.toLowerCase() === decoded ||
      m.playerB?.nickname.toLowerCase() === decoded
  );

  // Ordena: pending → result_submitted → disputed → finalized (recentes primeiro)
  const priority: Record<string, number> = {
    pending: 0,
    result_submitted: 1,
    disputed: 2,
    finalized: 3,
    bye: 4,
    tbd: 5
  };
  mine.sort((a, b) => {
    const pa = priority[a.status] ?? 99;
    const pb = priority[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    // dentro do mesmo status, mais recente primeiro
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Estatísticas
  const stats = computeStats(mine, decoded);

  return NextResponse.json({ matches: mine, stats });
}

function emptyStats() {
  return { total: 0, wins: 0, losses: 0, titles: 0, winRate: 0, pending: 0 };
}

function computeStats(matches: ReturnType<typeof useMatchesType>, nick: string) {
  let wins = 0;
  let losses = 0;
  let titles = 0;
  let pending = 0;

  // O último round (Final) é onde se decide o título
  const maxRound = matches.reduce((max, m) => Math.max(max, m.round), 0);

  for (const m of matches) {
    if (m.status === "pending" || m.status === "result_submitted") {
      pending++;
      continue;
    }
    if (m.status !== "finalized" && m.status !== "bye") continue;
    const isA = m.playerA?.nickname.toLowerCase() === nick;
    const won = (isA && m.winner === "A") || (!isA && m.winner === "B");
    if (won) {
      wins++;
      if (m.round === maxRound && m.status === "finalized") titles++;
    } else {
      losses++;
    }
  }

  const totalDecided = wins + losses;
  const winRate = totalDecided > 0 ? Math.round((wins / totalDecided) * 100) : 0;
  return { total: matches.length, wins, losses, titles, winRate, pending };
}

// helper só pra tipagem
type Awaited<T> = T extends Promise<infer U> ? U : T;
type MatchArray = Awaited<ReturnType<typeof readAllMatches>>;
function useMatchesType(): MatchArray {
  return [] as MatchArray;
}
