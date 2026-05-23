export type TournamentRegistration = {
  tournamentId: string;
  nickname: string;
  teamName: string;
  platform: string;
  whatsapp: string;
  paymentMethod: "free" | "mercado_pago" | "pagseguro" | "ppc";
  paymentStatus: "free" | "paid";
  createdAt: string;
};

export const TOURNAMENT_REGISTRATION_STORAGE_KEY = "ppb_registrations_v1";

function normalizeRegistration(input: unknown): TournamentRegistration | null {
  if (!input || typeof input !== "object") return null;

  const item = input as Partial<TournamentRegistration>;
  const tournamentId = typeof item.tournamentId === "string" ? item.tournamentId : "";
  const nickname = typeof item.nickname === "string" ? item.nickname : "";
  const platform = typeof item.platform === "string" ? item.platform : "";
  const whatsapp = typeof item.whatsapp === "string" ? item.whatsapp : "";

  if (!tournamentId || !nickname || !platform || !whatsapp) return null;

  const paymentMethod =
    item.paymentMethod === "mercado_pago" ||
    item.paymentMethod === "pagseguro" ||
    item.paymentMethod === "ppc"
      ? item.paymentMethod
      : "free";

  const paymentStatus = item.paymentStatus === "paid" ? "paid" : "free";

  return {
    tournamentId,
    nickname,
    teamName: typeof item.teamName === "string" ? item.teamName : "",
    platform,
    whatsapp,
    paymentMethod,
    paymentStatus,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString()
  };
}

export function readTournamentRegistrations(): TournamentRegistration[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(TOURNAMENT_REGISTRATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRegistration).filter(Boolean) as TournamentRegistration[];
  } catch {
    return [];
  }
}

export function writeTournamentRegistrations(list: TournamentRegistration[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOURNAMENT_REGISTRATION_STORAGE_KEY, JSON.stringify(list));
}

export function getTournamentRegistrationsById(tournamentId: string) {
  return readTournamentRegistrations().filter((registration) => registration.tournamentId === tournamentId);
}

export function upsertTournamentRegistration(next: TournamentRegistration) {
  const all = readTournamentRegistrations();
  const withoutCurrent = all.filter(
    (registration) =>
      !(registration.tournamentId === next.tournamentId && registration.nickname.toLowerCase() === next.nickname.toLowerCase())
  );

  writeTournamentRegistrations([next, ...withoutCurrent]);
}
