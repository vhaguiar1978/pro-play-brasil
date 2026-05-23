export type MockMatch = {
  id: string;
  tournamentId: string;
  roundLabel: string;
  playerA: { nickname: string; tag: string };
  playerB: { nickname: string; tag: string };
  scheduledAt: string;
  status: "aguardando_inicio" | "em_andamento" | "resultado_pendente" | "finalizada";
  scoreLabel: string | null;
  /** Minutos restantes ficticios para UI de confirmacao */
  confirmMinutesLeft: number | null;
};

export const MOCK_MATCHES: MockMatch[] = [
];

export function getMatchById(id: string): MockMatch | undefined {
  return MOCK_MATCHES.find((m) => m.id === id);
}
