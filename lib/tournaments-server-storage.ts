import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { MockTournament, TournamentFormat, TournamentOrigin, TournamentStatus } from "@/lib/mock-tournaments";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Storage de campeonatos criados pelo admin.
// Backend automático: Supabase em prod, filesystem JSON em dev.
// SQL da table está em docs/SUPABASE_MIGRATION.md (tournaments_server).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "tournaments-server.json");
const TABLE = "tournaments_server";

export type ServerTournament = MockTournament & {
  createdAt: string;
  updatedAt: string;
};

export type TournamentInput = {
  name: string;
  gameSlug: string;
  origin?: TournamentOrigin;
  description?: string;
  platform: string;
  maxPlayers: number;
  minimumPlayers?: number;
  registered?: number;
  startDate: string;
  feeLabel?: string | null;
  prize: string;
  format?: TournamentFormat;
  status?: TournamentStatus;
  regionLabel: string;
};

const FORMATS: TournamentFormat[] = ["eliminacao", "grupos", "pontos"];
const STATUSES: TournamentStatus[] = ["open", "live", "finished"];

function shouldUseSupabase(): boolean {
  return isSupabaseAdminConfigured();
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

function slugifyId(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "campeonato"}-${Date.now().toString(36)}`;
}

// Mapeamento snake_case (Supabase) ↔ camelCase (app)
type DbRow = {
  id: string;
  name: string;
  game_slug: string;
  origin: TournamentOrigin;
  description: string | null;
  platform: string;
  max_players: number;
  minimum_players: number | null;
  registered: number;
  start_date: string;
  fee_label: string | null;
  prize: string;
  format: TournamentFormat;
  status: TournamentStatus;
  region_label: string;
  participants: unknown;
  created_at: string;
  updated_at: string;
};

function rowToTournament(row: DbRow): ServerTournament {
  return {
    id: row.id,
    name: row.name,
    gameSlug: row.game_slug,
    origin: row.origin,
    description: row.description ?? "",
    platform: row.platform,
    maxPlayers: row.max_players,
    minimumPlayers: row.minimum_players ?? undefined,
    registered: row.registered,
    startDate: row.start_date,
    feeLabel: row.fee_label,
    prize: row.prize,
    format: row.format,
    status: row.status,
    regionLabel: row.region_label,
    participants: Array.isArray(row.participants) ? (row.participants as ServerTournament["participants"]) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function tournamentToRow(t: ServerTournament): Omit<DbRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: t.id,
    name: t.name,
    game_slug: t.gameSlug,
    origin: t.origin,
    description: t.description ?? "",
    platform: t.platform,
    max_players: t.maxPlayers,
    minimum_players: t.minimumPlayers ?? null,
    registered: t.registered,
    start_date: t.startDate,
    fee_label: t.feeLabel,
    prize: t.prize,
    format: t.format,
    status: t.status,
    region_label: t.regionLabel,
    participants: t.participants ?? [],
    created_at: t.createdAt,
    updated_at: t.updatedAt
  };
}

function sanitizeInput(input: unknown): TournamentInput | { error: string } {
  if (!input || typeof input !== "object") return { error: "JSON inválido" };
  const i = input as Record<string, unknown>;

  const name = typeof i.name === "string" ? i.name.trim() : "";
  const gameSlug = typeof i.gameSlug === "string" ? i.gameSlug.trim() : "";
  const platform = typeof i.platform === "string" ? i.platform.trim() : "";
  const startDate = typeof i.startDate === "string" ? i.startDate : "";
  const regionLabel = typeof i.regionLabel === "string" ? i.regionLabel.trim() : "";
  const prize = typeof i.prize === "string" ? i.prize.trim() : "";

  if (!name) return { error: "Nome é obrigatório" };
  if (!gameSlug) return { error: "Jogo é obrigatório" };
  if (!platform) return { error: "Plataforma é obrigatória" };
  if (!startDate) return { error: "Data de início é obrigatória" };
  if (!regionLabel) return { error: "Região é obrigatória" };
  if (!prize) return { error: "Premiação é obrigatória" };

  const maxPlayers = typeof i.maxPlayers === "number" && i.maxPlayers >= 2 ? Math.floor(i.maxPlayers) : 0;
  if (!maxPlayers) return { error: "Limite de participantes deve ser >= 2" };

  const minimumPlayers = typeof i.minimumPlayers === "number" && i.minimumPlayers >= 1 ? Math.floor(i.minimumPlayers) : undefined;
  const registered = typeof i.registered === "number" && i.registered >= 0 ? Math.floor(i.registered) : 0;

  const format: TournamentFormat = FORMATS.includes(i.format as TournamentFormat) ? (i.format as TournamentFormat) : "eliminacao";
  const status: TournamentStatus = STATUSES.includes(i.status as TournamentStatus) ? (i.status as TournamentStatus) : "open";
  const origin: TournamentOrigin = i.origin === "community" ? "community" : "official";

  let feeLabel: string | null = null;
  if (typeof i.feeLabel === "string" && i.feeLabel.trim().length > 0) feeLabel = i.feeLabel.trim();

  return {
    name: name.slice(0, 80),
    gameSlug,
    origin,
    description: typeof i.description === "string" ? i.description.trim().slice(0, 500) : "",
    platform: platform.slice(0, 100),
    maxPlayers,
    minimumPlayers,
    registered,
    startDate,
    feeLabel,
    prize: prize.slice(0, 100),
    format,
    status,
    regionLabel: regionLabel.slice(0, 60)
  };
}

export async function readServerTournaments(): Promise<ServerTournament[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("start_date", { ascending: true });
    if (error) throw new Error(`Supabase readServerTournaments: ${error.message}`);
    return (data ?? []).map((row) => rowToTournament(row as DbRow));
  }
  return readJson<ServerTournament[]>(FILE, []);
}

export async function createServerTournament(rawInput: unknown): Promise<ServerTournament | { error: string }> {
  const parsed = sanitizeInput(rawInput);
  if ("error" in parsed) return parsed;
  const now = new Date().toISOString();
  const tournament: ServerTournament = {
    id: slugifyId(parsed.name),
    name: parsed.name,
    gameSlug: parsed.gameSlug,
    origin: parsed.origin ?? "official",
    description: parsed.description ?? "",
    platform: parsed.platform,
    maxPlayers: parsed.maxPlayers,
    minimumPlayers: parsed.minimumPlayers,
    registered: parsed.registered ?? 0,
    startDate: parsed.startDate,
    feeLabel: parsed.feeLabel ?? null,
    prize: parsed.prize,
    format: parsed.format ?? "eliminacao",
    status: parsed.status ?? "open",
    regionLabel: parsed.regionLabel,
    participants: [],
    createdAt: now,
    updatedAt: now
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).insert(tournamentToRow(tournament));
    if (error) throw new Error(`Supabase createServerTournament: ${error.message}`);
    return tournament;
  }

  const all = await readJson<ServerTournament[]>(FILE, []);
  all.push(tournament);
  await writeJson(FILE, all);
  return tournament;
}

export async function updateServerTournament(
  id: string,
  rawInput: unknown
): Promise<ServerTournament | { error: string }> {
  const parsed = sanitizeInput(rawInput);
  if ("error" in parsed) return parsed;

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const existing = await getServerTournamentById(id);
    if (!existing) return { error: "Campeonato não encontrado" };
    const updated: ServerTournament = {
      ...existing,
      ...parsed,
      feeLabel: parsed.feeLabel ?? null,
      updatedAt: new Date().toISOString()
    };
    const { error } = await supabase
      .from(TABLE)
      .update(tournamentToRow(updated))
      .eq("id", id);
    if (error) throw new Error(`Supabase updateServerTournament: ${error.message}`);
    return updated;
  }

  const all = await readJson<ServerTournament[]>(FILE, []);
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return { error: "Campeonato não encontrado" };
  const updated: ServerTournament = {
    ...all[idx],
    ...parsed,
    feeLabel: parsed.feeLabel ?? null,
    updatedAt: new Date().toISOString()
  };
  all[idx] = updated;
  await writeJson(FILE, all);
  return updated;
}

export async function deleteServerTournament(id: string): Promise<{ ok: boolean }> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(`Supabase deleteServerTournament: ${error.message}`);
    return { ok: true };
  }
  const all = await readJson<ServerTournament[]>(FILE, []);
  const next = all.filter((t) => t.id !== id);
  await writeJson(FILE, next);
  return { ok: true };
}

export async function getServerTournamentById(id: string): Promise<ServerTournament | undefined> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase getServerTournamentById: ${error.message}`);
    return data ? rowToTournament(data as DbRow) : undefined;
  }
  const all = await readJson<ServerTournament[]>(FILE, []);
  return all.find((t) => t.id === id);
}
