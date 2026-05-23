"use client";

import { GAMES } from "@/lib/games";
import type { MockTournament, TournamentFormat, TournamentOrigin, TournamentStatus } from "@/lib/mock-tournaments";

export type TournamentAutomationRule = {
  gameSlug: string;
  enabled: boolean;
  titleBase: string;
  description: string;
  platform: string;
  format: TournamentFormat;
  origin: TournamentOrigin;
  status: TournamentStatus;
  maxPlayers: number;
  minimumPlayers: number;
  regionLabel: string;
  prize: string;
  feeLabel: string;
  leadDays: number;
  cadenceDays: number;
  keepUpcomingCount: number;
  startHour: number;
  startMinute: number;
};

export type TournamentAutomationSettings = {
  autoCreateEnabled: boolean;
  autoCleanupEnabled: boolean;
  cleanupIncludesManual: boolean;
  games: TournamentAutomationRule[];
};

export type TournamentAutomationReport = {
  created: number;
  deleted: number;
  totalCustom: number;
};

const TOURNAMENT_AUTOMATION_KEY = "ppb_tournament_automation_v1";
const CUSTOM_TOURNAMENT_STORAGE_KEY = "ppb_custom_tournaments_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function slugToPlatform(gameSlug: string) {
  switch (gameSlug) {
    case "fifa":
      return "PlayStation 5, Xbox Series e PC";
    case "free-fire":
      return "Android e iOS";
    case "valorant":
    case "counter-strike-2":
      return "PC";
    case "call-of-duty":
      return "PlayStation 5, Xbox Series e PC";
    case "pubg":
      return "PC e Console";
    default:
      return "PC";
  }
}

function slugToFormat(gameSlug: string): TournamentFormat {
  if (gameSlug === "fifa" || gameSlug === "free-fire") return "grupos";
  if (gameSlug === "counter-strike-2") return "pontos";
  return "eliminacao";
}

function slugToMaxPlayers(gameSlug: string) {
  if (gameSlug === "free-fire") return 48;
  if (gameSlug === "valorant" || gameSlug === "counter-strike-2") return 32;
  return 16;
}

function slugToMinimumPlayers(gameSlug: string) {
  if (gameSlug === "fifa" || gameSlug === "valorant" || gameSlug === "counter-strike-2" || gameSlug === "call-of-duty") {
    return 5;
  }

  return 1;
}

function createDefaultRule(gameSlug: string): TournamentAutomationRule {
  const game = GAMES.find((item) => item.slug === gameSlug);
  const titleBase = game?.name ?? gameSlug;

  return {
    gameSlug,
    enabled: true,
    titleBase: `${titleBase} Open Pro Play`,
    description: `Campeonato gerado automaticamente para manter a agenda oficial de ${titleBase} ativa na Pro Play Brasil.`,
    platform: slugToPlatform(gameSlug),
    format: slugToFormat(gameSlug),
    origin: "official",
    status: "open",
    maxPlayers: slugToMaxPlayers(gameSlug),
    minimumPlayers: slugToMinimumPlayers(gameSlug),
    regionLabel: "Brasil",
    prize: "300 PPC para o campeao",
    feeLabel: "",
    leadDays: 7,
    cadenceDays: 14,
    keepUpcomingCount: 1,
    startHour: 21,
    startMinute: 0
  };
}

function createDefaultSettings(): TournamentAutomationSettings {
  return {
    autoCreateEnabled: true,
    autoCleanupEnabled: true,
    cleanupIncludesManual: true,
    games: GAMES.map((game) => createDefaultRule(game.slug))
  };
}

function normalizeRule(value: Partial<TournamentAutomationRule> | null | undefined, fallback: TournamentAutomationRule) {
  return {
    gameSlug: fallback.gameSlug,
    enabled: typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    titleBase: typeof value?.titleBase === "string" && value.titleBase.trim() ? value.titleBase.trim() : fallback.titleBase,
    description:
      typeof value?.description === "string" && value.description.trim() ? value.description.trim() : fallback.description,
    platform: typeof value?.platform === "string" && value.platform.trim() ? value.platform.trim() : fallback.platform,
    format:
      value?.format === "grupos" || value?.format === "pontos" || value?.format === "eliminacao"
        ? value.format
        : fallback.format,
    origin: value?.origin === "community" ? "community" : fallback.origin,
    status: value?.status === "live" || value?.status === "finished" ? value.status : fallback.status,
    maxPlayers: clamp(Number(value?.maxPlayers) || fallback.maxPlayers, 2, 256),
    minimumPlayers: clamp(Number(value?.minimumPlayers) || fallback.minimumPlayers, 1, 64),
    regionLabel:
      typeof value?.regionLabel === "string" && value.regionLabel.trim() ? value.regionLabel.trim() : fallback.regionLabel,
    prize: typeof value?.prize === "string" && value.prize.trim() ? value.prize.trim() : fallback.prize,
    feeLabel: typeof value?.feeLabel === "string" ? value.feeLabel.trim() : fallback.feeLabel,
    leadDays: clamp(Number(value?.leadDays) || fallback.leadDays, 1, 120),
    cadenceDays: clamp(Number(value?.cadenceDays) || fallback.cadenceDays, 1, 120),
    keepUpcomingCount: clamp(Number(value?.keepUpcomingCount) || fallback.keepUpcomingCount, 1, 8),
    startHour: clamp(Number(value?.startHour) || fallback.startHour, 0, 23),
    startMinute: clamp(Number(value?.startMinute) || fallback.startMinute, 0, 59)
  };
}

export function readTournamentAutomationSettings(): TournamentAutomationSettings {
  const fallback = createDefaultSettings();

  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(TOURNAMENT_AUTOMATION_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<TournamentAutomationSettings> | null;
    if (!parsed || typeof parsed !== "object") return fallback;

    const parsedGames = Array.isArray(parsed.games) ? parsed.games : [];

    return {
      autoCreateEnabled:
        typeof parsed.autoCreateEnabled === "boolean" ? parsed.autoCreateEnabled : fallback.autoCreateEnabled,
      autoCleanupEnabled:
        typeof parsed.autoCleanupEnabled === "boolean" ? parsed.autoCleanupEnabled : fallback.autoCleanupEnabled,
      cleanupIncludesManual:
        typeof parsed.cleanupIncludesManual === "boolean" ? parsed.cleanupIncludesManual : fallback.cleanupIncludesManual,
      games: GAMES.map((game) =>
        normalizeRule(
          parsedGames.find((item) => item && typeof item === "object" && item.gameSlug === game.slug),
          createDefaultRule(game.slug)
        )
      )
    };
  } catch {
    return fallback;
  }
}

export function writeTournamentAutomationSettings(settings: TournamentAutomationSettings) {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOURNAMENT_AUTOMATION_KEY, JSON.stringify(settings));
}

function formatDateSuffix(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

function toScheduleKey(gameSlug: string, date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${gameSlug}-${year}${month}${day}${hour}${minute}`;
}

function buildScheduledDate(rule: TournamentAutomationRule, slotIndex: number, now: Date) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + rule.leadDays + rule.cadenceDays * slotIndex);
  date.setHours(rule.startHour, rule.startMinute, 0, 0);

  if (date.getTime() <= now.getTime()) {
    date.setDate(date.getDate() + rule.cadenceDays);
  }

  return date;
}

function hasNoRegistrations(tournament: MockTournament) {
  return tournament.registered <= 0 && tournament.participants.length === 0;
}

function isPastTournament(tournament: MockTournament, now: Date) {
  return new Date(tournament.startDate).getTime() < now.getTime();
}

function isUpcomingTournament(tournament: MockTournament, now: Date) {
  return new Date(tournament.startDate).getTime() >= now.getTime() && tournament.status !== "finished";
}

function isAutomatedTournament(tournament: MockTournament) {
  return Boolean(tournament.automation?.managed);
}

function buildAutomatedTournament(rule: TournamentAutomationRule, scheduledDate: Date): MockTournament {
  const id = `auto-${toScheduleKey(rule.gameSlug, scheduledDate)}`;

  return {
    id,
    name: `${rule.titleBase} - ${formatDateSuffix(scheduledDate)}`,
    gameSlug: rule.gameSlug,
    origin: rule.origin,
    description: rule.description,
    platform: rule.platform,
    maxPlayers: rule.maxPlayers,
    minimumPlayers: rule.minimumPlayers,
    registered: 0,
    startDate: scheduledDate.toISOString(),
    feeLabel: rule.feeLabel || null,
    prize: rule.prize,
    format: rule.format,
    status: rule.status,
    regionLabel: rule.regionLabel,
    participants: [],
    automation: {
      managed: true,
      gameSlug: rule.gameSlug,
      scheduleKey: toScheduleKey(rule.gameSlug, scheduledDate),
      createdAt: new Date().toISOString()
    }
  };
}

export function applyTournamentAutomation(
  customTournaments: MockTournament[],
  officialTournaments: MockTournament[] = [],
  now = new Date()
) {
  const settings = readTournamentAutomationSettings();
  let working = [...customTournaments];
  let deleted = 0;
  let created = 0;

  if (settings.autoCleanupEnabled) {
    working = working.filter((tournament) => {
      if (!isPastTournament(tournament, now) || !hasNoRegistrations(tournament)) {
        return true;
      }

      if (settings.cleanupIncludesManual || isAutomatedTournament(tournament)) {
        deleted += 1;
        return false;
      }

      return true;
    });
  }

  if (settings.autoCreateEnabled) {
    const combinedExisting = [...officialTournaments, ...working];

    settings.games
      .filter((rule) => rule.enabled)
      .forEach((rule) => {
        const existingKeys = new Set(
          combinedExisting
            .filter((tournament) => tournament.gameSlug === rule.gameSlug)
            .map((tournament) => toScheduleKey(rule.gameSlug, new Date(tournament.startDate)))
        );

        const currentUpcoming = combinedExisting.filter(
          (tournament) => tournament.gameSlug === rule.gameSlug && isUpcomingTournament(tournament, now)
        ).length;

        const missing = Math.max(0, rule.keepUpcomingCount - currentUpcoming);

        for (let slotIndex = 0; slotIndex < missing; slotIndex += 1) {
          let scheduledDate = buildScheduledDate(rule, slotIndex, now);
          let guard = 0;

          while (existingKeys.has(toScheduleKey(rule.gameSlug, scheduledDate)) && guard < 20) {
            scheduledDate = new Date(scheduledDate);
            scheduledDate.setDate(scheduledDate.getDate() + rule.cadenceDays);
            guard += 1;
          }

          const nextTournament = buildAutomatedTournament(rule, scheduledDate);
          working.push(nextTournament);
          combinedExisting.push(nextTournament);
          existingKeys.add(toScheduleKey(rule.gameSlug, scheduledDate));
          created += 1;
        }
      });
  }

  const tournaments = [...working].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const changed = created > 0 || deleted > 0 || tournaments.length !== customTournaments.length;

  if (changed && isBrowser()) {
    window.localStorage.setItem(CUSTOM_TOURNAMENT_STORAGE_KEY, JSON.stringify(tournaments));
  }

  return {
    tournaments,
    report: {
      created,
      deleted,
      totalCustom: tournaments.length
    } satisfies TournamentAutomationReport
  };
}
