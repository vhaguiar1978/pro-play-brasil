import { getParticipantStream } from "@/lib/mock-streams";
import { getTournamentById, type TournamentFormat } from "@/lib/mock-tournaments";

export type Seed = {
  id: string;
  label: string;
  sublabel?: string | null;
  twitchUrl?: string | null;
  isLive?: boolean;
};

export type Match = {
  id: string;
  a: Seed | null;
  b: Seed | null;
  scoreA?: number | null;
  scoreB?: number | null;
  status: "pendente" | "ao_vivo" | "finalizada";
};

export type KnockoutRound = { name: string; matches: Match[] };

export type Group = {
  name: string;
  teams: { seed: Seed; pts: number; w: number; d: number; l: number; gf: number; ga: number }[];
};

export type Structure =
  | { format: "eliminacao"; rounds: KnockoutRound[] }
  | { format: "grupos"; groups: Group[]; knockout: KnockoutRound[] }
  | { format: "pontos"; table: Group["teams"] };

function seedsFor(tournamentId: string, count: number): Seed[] {
  const targetCount = Math.max(2, Math.min(count, 16));
  const tournament = getTournamentById(tournamentId);
  const participants = tournament?.participants ?? [];

  return Array.from({ length: targetCount }, (_, idx) => {
    const fallbackLabel = `Jogador ${idx + 1}`;
    const participant = participants[idx];
    const nickname = participant?.nickname ?? fallbackLabel;
    const teamName = participant?.teamName?.trim() ? participant.teamName.trim() : null;
    const stream = getParticipantStream(nickname);

    return {
      id: `${tournamentId}-${idx + 1}`,
      label: teamName ?? nickname,
      sublabel: teamName ? nickname : null,
      twitchUrl: stream?.twitchUrl ?? null,
      isLive: stream?.isLive ?? false
    };
  });
}

function pairToMatches(teams: Seed[], prefix: string): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    matches.push({
      id: `${prefix}-m${i / 2 + 1}`,
      a: teams[i] ?? null,
      b: teams[i + 1] ?? null,
      status: "pendente",
      scoreA: null,
      scoreB: null
    });
  }
  return matches;
}

export function getMockStructure(format: TournamentFormat, tournamentId: string, maxPlayers: number): Structure {
  if (format === "eliminacao") {
    // pega um tamanho de chave "potência de 2" até 16 só para preview
    const bracketSize = maxPlayers >= 16 ? 16 : maxPlayers >= 8 ? 8 : maxPlayers >= 4 ? 4 : 2;
    const teams = seedsFor(tournamentId, bracketSize);
    const r1 = pairToMatches(teams, `${tournamentId}-r1`);

    const mkNext = (prev: Match[], roundPrefix: string): Match[] =>
      prev.slice(0, Math.max(1, Math.floor(prev.length / 2))).map((_, i) => ({
        id: `${roundPrefix}-m${i + 1}`,
        a: null,
        b: null,
        status: "pendente",
        scoreA: null,
        scoreB: null
      }));

    const r2 = mkNext(r1, `${tournamentId}-r2`);
    const r3 = mkNext(r2, `${tournamentId}-r3`);
    const rounds: KnockoutRound[] = [
      { name: bracketSize === 16 ? "Oitavas" : bracketSize === 8 ? "Quartas" : bracketSize === 4 ? "Semifinal" : "Final", matches: r1 }
    ];
    if (r2.length >= 1 && bracketSize >= 4) rounds.push({ name: bracketSize === 16 ? "Quartas" : bracketSize === 8 ? "Semifinal" : "Final", matches: r2 });
    if (r3.length >= 1 && bracketSize >= 8) rounds.push({ name: bracketSize === 16 ? "Semifinal" : "Final", matches: r3 });
    if (bracketSize === 16) rounds.push({ name: "Final", matches: mkNext(r3, `${tournamentId}-r4`) });

    return { format: "eliminacao", rounds };
  }

  if (format === "grupos") {
    const teams = seedsFor(tournamentId, Math.min(8, Math.max(4, maxPlayers)));
    const a = teams.slice(0, Math.ceil(teams.length / 2));
    const b = teams.slice(Math.ceil(teams.length / 2));

    const mkTeamRow = (seed: Seed, pts: number) => ({ seed, pts, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
    const groups: Group[] = [
      { name: "Grupo A", teams: a.map((s, i) => mkTeamRow(s, 3 - i)) },
      { name: "Grupo B", teams: b.map((s, i) => mkTeamRow(s, 3 - i)) }
    ];

    const knockoutTeams = [groups[0].teams[0]?.seed, groups[0].teams[1]?.seed, groups[1].teams[0]?.seed, groups[1].teams[1]?.seed].filter(
      Boolean
    ) as Seed[];

    const semi = pairToMatches(knockoutTeams, `${tournamentId}-semi`);
    const final: Match[] = [
      { id: `${tournamentId}-final-m1`, a: null, b: null, status: "pendente", scoreA: null, scoreB: null }
    ];

    return {
      format: "grupos",
      groups,
      knockout: [
        { name: "Semifinal", matches: semi },
        { name: "Final", matches: final }
      ]
    };
  }

  // pontos corridos
  const teams = seedsFor(tournamentId, Math.min(10, Math.max(6, maxPlayers)));
  const table = teams.map((seed, i) => ({
    seed,
    pts: Math.max(0, 18 - i * 2),
    w: Math.max(0, 6 - i),
    d: i % 2,
    l: Math.max(0, i - 2),
    gf: 12 - i,
    ga: 6 + i
  }));
  return { format: "pontos", table };
}

