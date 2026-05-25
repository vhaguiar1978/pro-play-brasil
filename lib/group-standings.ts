// Helper puro: calcula classificação dos grupos a partir de uma lista de matches.
// Vitória vale 3 pontos, derrota 0. Critérios de desempate: pontos → saldo → gols pró → confronto direto.

export type StandingsMatch = {
  id: string;
  round: number;
  roundLabel: string;
  status: string;
  playerA: { nickname: string } | null;
  playerB: { nickname: string } | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: "A" | "B" | null;
};

export type StandingRow = {
  nickname: string;
  played: number;
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type GroupStanding = {
  groupLabel: string; // "Grupo A"
  round: number;
  rows: StandingRow[];
};

function isGroupMatch(m: StandingsMatch): boolean {
  return /^Grupo\s/.test(m.roundLabel);
}

function emptyRow(nick: string): StandingRow {
  return {
    nickname: nick,
    played: 0,
    wins: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0
  };
}

/** Resolve confronto direto entre dois jogadores empatados — devolve 1, -1 ou 0. */
function headToHead(a: string, b: string, matches: StandingsMatch[]): number {
  const direct = matches.find((m) => {
    const nA = m.playerA?.nickname;
    const nB = m.playerB?.nickname;
    return (nA === a && nB === b) || (nA === b && nB === a);
  });
  if (!direct || direct.winner == null) return 0;
  const winnerNick = direct.winner === "A" ? direct.playerA?.nickname : direct.playerB?.nickname;
  if (winnerNick === a) return -1; // a vem antes (melhor)
  if (winnerNick === b) return 1;
  return 0;
}

export function computeGroupStandings(matches: StandingsMatch[]): GroupStanding[] {
  const groupMatches = matches.filter(isGroupMatch);
  if (groupMatches.length === 0) return [];

  // Agrupa por round (round == groupIdx + 1)
  const byRound = new Map<number, StandingsMatch[]>();
  for (const m of groupMatches) {
    const list = byRound.get(m.round) ?? [];
    list.push(m);
    byRound.set(m.round, list);
  }

  const groups: GroupStanding[] = [];
  for (const [round, list] of Array.from(byRound.entries()).sort((a, b) => a[0] - b[0])) {
    const rows = new Map<string, StandingRow>();
    const ensure = (nick: string) => {
      if (!rows.has(nick)) rows.set(nick, emptyRow(nick));
      return rows.get(nick)!;
    };

    // Inicializa rows com todos os jogadores do grupo (mesmo sem jogos finalizados)
    for (const m of list) {
      if (m.playerA?.nickname) ensure(m.playerA.nickname);
      if (m.playerB?.nickname) ensure(m.playerB.nickname);
    }

    // Soma estatísticas das partidas finalizadas
    for (const m of list) {
      if (m.status !== "finalized" && m.status !== "bye") continue;
      if (!m.playerA || !m.playerB) continue;
      if (m.scoreA == null || m.scoreB == null) continue;
      const A = ensure(m.playerA.nickname);
      const B = ensure(m.playerB.nickname);
      A.played++;
      B.played++;
      A.goalsFor += m.scoreA;
      A.goalsAgainst += m.scoreB;
      B.goalsFor += m.scoreB;
      B.goalsAgainst += m.scoreA;
      if (m.winner === "A") {
        A.wins++;
        A.points += 3;
        B.losses++;
      } else if (m.winner === "B") {
        B.wins++;
        B.points += 3;
        A.losses++;
      }
    }

    for (const r of rows.values()) r.goalDiff = r.goalsFor - r.goalsAgainst;

    const sorted = Array.from(rows.values()).sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      const direct = headToHead(a.nickname, b.nickname, list);
      if (direct !== 0) return direct;
      return a.nickname.localeCompare(b.nickname);
    });

    groups.push({
      groupLabel: list[0]?.roundLabel ?? `Grupo ${round}`,
      round,
      rows: sorted
    });
  }

  return groups;
}
