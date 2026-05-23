import { applyTournamentAutomation } from "@/lib/tournament-automation";

export type TournamentOrigin = "official" | "community";
export type TournamentFormat = "eliminacao" | "grupos" | "pontos";
export type TournamentStatus = "open" | "live" | "finished";

export type TournamentParticipant = {
  nickname: string;
  teamName?: string | null;
};

export type TournamentAutomationMeta = {
  managed: true;
  gameSlug: string;
  scheduleKey: string;
  createdAt: string;
};

export type MockTournament = {
  id: string;
  name: string;
  gameSlug: string;
  origin: TournamentOrigin;
  description?: string;
  platform: string;
  maxPlayers: number;
  minimumPlayers?: number;
  registered: number;
  startDate: string;
  feeLabel: string | null;
  prize: string;
  format: TournamentFormat;
  status: TournamentStatus;
  regionLabel: string;
  participants: TournamentParticipant[];
  automation?: TournamentAutomationMeta | null;
};

export const MOCK_TOURNAMENTS: MockTournament[] = [
  {
    id: "fc26-pro-clubs-open",
    name: "FC26 Pro Clubs Open",
    gameSlug: "fifa",
    origin: "official",
    description:
      "Primeiro campeonato oficial de FC26 Pro Clubs da Pro Play Brasil com foco em clubes competitivos e lancamento do beta aberto.",
    platform: "PlayStation 5, Xbox Series e PC",
    maxPlayers: 16,
    minimumPlayers: 5,
    registered: 10,
    startDate: "2026-04-26T21:30:00-03:00",
    feeLabel: null,
    prize: "300 PPC para o time campeao",
    format: "grupos",
    status: "open",
    regionLabel: "Brasil",
    participants: [
      { nickname: "CapitaoKaique", teamName: "BRZ Elite" },
      { nickname: "PedroPlay", teamName: "Noia FC" },
      { nickname: "RafaCF", teamName: "Titan Pro" }
    ]
  },
  {
    id: "free-fire-squad-series",
    name: "Free Fire Squad Series",
    gameSlug: "free-fire",
    origin: "official",
    description: "Torneio squad com leitura mobile-first, classificacao por pontos e transmissao oficial.",
    platform: "Android e iOS",
    maxPlayers: 48,
    registered: 34,
    startDate: "2026-04-28T20:00:00-03:00",
    feeLabel: "5 PPC",
    prize: "R$ 1.000 + destaque oficial",
    format: "grupos",
    status: "open",
    regionLabel: "Brasil",
    participants: []
  },
  {
    id: "valorant-elite-cup",
    name: "Valorant Elite Cup",
    gameSlug: "valorant",
    origin: "official",
    description: "Mata-mata premium para lineups taticas com acompanhamento ao vivo pela plataforma.",
    platform: "PC",
    maxPlayers: 32,
    minimumPlayers: 5,
    registered: 24,
    startDate: "2026-04-22T19:30:00-03:00",
    feeLabel: "R$ 25,00",
    prize: "R$ 2.000 + vaga na proxima etapa",
    format: "eliminacao",
    status: "live",
    regionLabel: "Sudeste",
    participants: []
  },
  {
    id: "cs2-prime-league",
    name: "CS2 Prime League",
    gameSlug: "counter-strike-2",
    origin: "official",
    description: "Liga em pontos corridos com rounds finais em bracket para definir o campeao do split.",
    platform: "PC",
    maxPlayers: 20,
    minimumPlayers: 5,
    registered: 20,
    startDate: "2026-04-18T18:00:00-03:00",
    feeLabel: "R$ 35,00",
    prize: "R$ 3.500 + trofeu digital",
    format: "pontos",
    status: "finished",
    regionLabel: "Nacional",
    participants: []
  }
];

export const CUSTOM_TOURNAMENT_STORAGE_KEY = "ppb_custom_tournaments_v1";

function normalizeTournament(input: unknown): MockTournament | null {
  if (!input || typeof input !== "object") return null;

  const item = input as Partial<MockTournament>;
  const id = typeof item.id === "string" ? item.id.trim() : "";
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const gameSlug = typeof item.gameSlug === "string" ? item.gameSlug.trim() : "";
  const platform = typeof item.platform === "string" ? item.platform.trim() : "";
  const startDate = typeof item.startDate === "string" ? item.startDate : "";
  const regionLabel = typeof item.regionLabel === "string" ? item.regionLabel.trim() : "";
  const prize = typeof item.prize === "string" ? item.prize.trim() : "";

  if (!id || !name || !gameSlug || !platform || !startDate || !regionLabel || !prize) {
    return null;
  }

  const origin: TournamentOrigin = item.origin === "community" ? "community" : "official";
  const format: TournamentFormat =
    item.format === "grupos" || item.format === "pontos" ? item.format : "eliminacao";
  const status: TournamentStatus =
    item.status === "live" || item.status === "finished" ? item.status : "open";

  const participants = Array.isArray(item.participants)
    ? item.participants
        .filter((participant): participant is TournamentParticipant => Boolean(participant && typeof participant === "object"))
        .map((participant) => ({
          nickname: typeof participant.nickname === "string" ? participant.nickname.trim() : "",
          teamName: typeof participant.teamName === "string" ? participant.teamName.trim() : null
        }))
        .filter((participant) => participant.nickname.length > 0)
    : [];

  return {
    id,
    name,
    gameSlug,
    origin,
    description: typeof item.description === "string" ? item.description.trim() : "",
    platform,
    maxPlayers: typeof item.maxPlayers === "number" ? item.maxPlayers : 2,
    minimumPlayers: typeof item.minimumPlayers === "number" ? item.minimumPlayers : undefined,
    registered: typeof item.registered === "number" ? item.registered : participants.length,
    startDate,
    feeLabel: typeof item.feeLabel === "string" && item.feeLabel.trim().length > 0 ? item.feeLabel.trim() : null,
    prize,
    format,
    status,
    regionLabel,
    participants,
    automation:
      item.automation &&
      typeof item.automation === "object" &&
      item.automation.managed === true &&
      typeof item.automation.gameSlug === "string" &&
      typeof item.automation.scheduleKey === "string" &&
      typeof item.automation.createdAt === "string"
        ? {
            managed: true,
            gameSlug: item.automation.gameSlug,
            scheduleKey: item.automation.scheduleKey,
            createdAt: item.automation.createdAt
          }
        : null
  };
}

export function readCustomTournaments(): MockTournament[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_TOURNAMENT_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeTournament)
      .filter(Boolean)
      .sort((a, b) => new Date(a!.startDate).getTime() - new Date(b!.startDate).getTime()) as MockTournament[];
  } catch {
    return [];
  }
}

export function writeCustomTournaments(list: MockTournament[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_TOURNAMENT_STORAGE_KEY, JSON.stringify(list));
}

export function getAllTournaments(): MockTournament[] {
  if (typeof window === "undefined") {
    return MOCK_TOURNAMENTS.slice();
  }

  const automated = applyTournamentAutomation(readCustomTournaments(), MOCK_TOURNAMENTS).tournaments;

  return [...MOCK_TOURNAMENTS, ...automated].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

export function upsertCustomTournament(next: MockTournament) {
  const current = readCustomTournaments();
  const filtered = current.filter((item) => item.id !== next.id);
  writeCustomTournaments([next, ...filtered]);
  return next;
}

export function deleteCustomTournament(id: string) {
  const current = readCustomTournaments();
  writeCustomTournaments(current.filter((item) => item.id !== id));
}

export function createCustomTournamentId(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "campeonato"}-${Date.now()}`;
}

export function getTournamentById(id: string): MockTournament | undefined {
  return getAllTournaments().find((item) => item.id === id);
}

export function getTournamentsByGameSlug(slug: string): MockTournament[] {
  return getAllTournaments().filter((item) => item.gameSlug === slug);
}

export function formatLabel(format: TournamentFormat): string {
  switch (format) {
    case "eliminacao":
      return "Mata-mata";
    case "grupos":
      return "Grupos + mata-mata";
    case "pontos":
      return "Pontos corridos";
    default:
      return format;
  }
}
