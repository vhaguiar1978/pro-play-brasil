"use client";

import { MOCK_MATCHES } from "@/lib/mock-matches";
import { getTournamentById } from "@/lib/mock-tournaments";
import { readTournamentRegistrations } from "@/lib/tournament-registration";

export type PlayerHistoryEntry = {
  id: string;
  nickname: string;
  tournamentId: string;
  tournamentName: string;
  playedAt: string;
  roundLabel: string;
  resultLabel: string;
  campaignLabel: string;
};

// Histórico local vazio — os dados reais vêm da API /api/player-history/[nickname]
const MOCK_PLAYER_HISTORY: PlayerHistoryEntry[] = [];

function inferCampaignForMatch(nickname: string, matchId: string, scoreLabel: string | null, roundLabel: string) {
  if (!scoreLabel) {
    return roundLabel.toLowerCase().includes("semi") ? "Semifinal em disputa" : "Aguardando resultado";
  }

  const [left, right] = scoreLabel.split("x").map((item) => Number.parseInt(item.trim(), 10));
  if (!Number.isFinite(left) || !Number.isFinite(right)) return "Resultado enviado";

  const match = MOCK_MATCHES.find((item) => item.id === matchId);
  const isPlayerA = match?.playerA.nickname.toLowerCase() === nickname.toLowerCase();
  const playerScore = isPlayerA ? left : right;
  const opponentScore = isPlayerA ? right : left;
  const eliminatedLabel = roundLabel.toLowerCase().includes("oitavas")
    ? "Eliminado nas oitavas"
    : roundLabel.toLowerCase().includes("quartas")
      ? "Eliminado nas quartas"
      : roundLabel.toLowerCase().includes("semi")
        ? "Eliminado na semifinal"
        : "Eliminado";

  return playerScore > opponentScore ? "Segue vivo no campeonato" : eliminatedLabel;
}

export function getPlayerHistory(nickname: string) {
  const normalizedNick = nickname.trim().toLowerCase();
  const fromMocks = MOCK_PLAYER_HISTORY.filter((entry) => entry.nickname.toLowerCase() === normalizedNick);

  const fromMatches = MOCK_MATCHES.filter(
    (match) =>
      match.playerA.nickname.toLowerCase() === normalizedNick || match.playerB.nickname.toLowerCase() === normalizedNick
  ).map((match) => {
    const tournament = getTournamentById(match.tournamentId);
    const isPlayerA = match.playerA.nickname.toLowerCase() === normalizedNick;
    const playerName = isPlayerA ? match.playerA.nickname : match.playerB.nickname;

    return {
      id: `history-${match.id}-${playerName}`,
      nickname: playerName,
      tournamentId: match.tournamentId,
      tournamentName: tournament?.name ?? "Campeonato Pro Play",
      playedAt: match.scheduledAt,
      roundLabel: match.roundLabel,
      resultLabel: match.scoreLabel ? `Placar ${match.scoreLabel}` : match.status === "em_andamento" ? "Ao vivo" : "Aguardando inicio",
      campaignLabel: inferCampaignForMatch(playerName, match.id, match.scoreLabel, match.roundLabel)
    };
  });

  const fromRegistrations = readTournamentRegistrations()
    .filter((item) => item.nickname.trim().toLowerCase() === normalizedNick)
    .map((item) => {
      const tournament = getTournamentById(item.tournamentId);
      return {
        id: `registration-${item.tournamentId}-${item.nickname}`,
        nickname: item.nickname,
        tournamentId: item.tournamentId,
        tournamentName: tournament?.name ?? "Campeonato Pro Play",
        playedAt: tournament?.startDate ?? item.createdAt,
        roundLabel: "Inscricao confirmada",
        resultLabel: "Aguardando estreia",
        campaignLabel: "Participando do campeonato"
      };
    });

  const map = new Map<string, PlayerHistoryEntry>();
  [...fromMocks, ...fromMatches, ...fromRegistrations].forEach((entry) => {
    map.set(entry.id, entry);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
}
