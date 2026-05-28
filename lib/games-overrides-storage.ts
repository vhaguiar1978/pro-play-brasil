import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { GAMES, type Game } from "@/lib/games";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Storage de overrides de jogos (CRUD do admin: nome, descrição, cor, status).
// Backend automático: Supabase em prod, filesystem JSON em dev.
// SQL da table está em docs/SUPABASE_MIGRATION.md (games_overrides).

const DATA_DIR = path.join(process.cwd(), "data");
const OVERRIDES_FILE = path.join(DATA_DIR, "games-overrides.json");
const LEGACY_STATUS_FILE = path.join(DATA_DIR, "games-status.json");
const TABLE = "games_overrides";

export type GameRuntimeStatus = "active" | "frozen" | "hidden";

export type GameOverride = {
  name?: string;
  shortDescription?: string;
  themeColor?: string;
  status?: GameRuntimeStatus;
  updatedAt?: string;
};

export type GamesOverridesMap = Record<string, GameOverride>;

type DbRow = {
  slug: string;
  name: string | null;
  short_description: string | null;
  theme_color: string | null;
  status: GameRuntimeStatus | null;
  updated_at: string;
};

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

function rowToOverride(row: DbRow): GameOverride {
  const o: GameOverride = { updatedAt: row.updated_at };
  if (row.name != null) o.name = row.name;
  if (row.short_description != null) o.shortDescription = row.short_description;
  if (row.theme_color != null) o.themeColor = row.theme_color;
  if (row.status != null) o.status = row.status;
  return o;
}

export async function readGamesOverrides(): Promise<GamesOverridesMap> {
  if (shouldUseSupabase()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from(TABLE).select("*");
      if (error) throw new Error(`Supabase readGamesOverrides: ${error.message}`);

      const out: GamesOverridesMap = {};
      for (const row of data ?? []) {
        out[(row as DbRow).slug] = rowToOverride(row as DbRow);
      }
      return out;
    } catch (error) {
      console.error("readGamesOverrides fallback:", error);
    }
  }

  // Filesystem (dev) + compat com arquivo legado games-status.json
  const overrides = await readJson<GamesOverridesMap>(OVERRIDES_FILE, {});
  const legacyStatus = await readJson<Record<string, GameRuntimeStatus>>(LEGACY_STATUS_FILE, {});
  for (const [slug, status] of Object.entries(legacyStatus)) {
    if (!overrides[slug]) overrides[slug] = {};
    if (overrides[slug].status === undefined) overrides[slug].status = status;
  }
  return overrides;
}

export async function setGameOverride(slug: string, patch: GameOverride): Promise<GamesOverridesMap> {
  const updatedAt = new Date().toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    // upsert: lê atual pra preservar campos não-tocados
    const { data: existing } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
    const current = existing ? rowToOverride(existing as DbRow) : {};
    const merged: GameOverride = { ...current, ...patch, updatedAt };
    const { error } = await supabase
      .from(TABLE)
      .upsert({
        slug,
        name: merged.name ?? null,
        short_description: merged.shortDescription ?? null,
        theme_color: merged.themeColor ?? null,
        status: merged.status ?? null,
        updated_at: updatedAt
      });
    if (error) throw new Error(`Supabase setGameOverride: ${error.message}`);
    return readGamesOverrides();
  }

  const current = await readGamesOverrides();
  const existing = current[slug] ?? {};
  current[slug] = { ...existing, ...patch, updatedAt };
  await writeJson(OVERRIDES_FILE, current);
  return current;
}

export async function clearGameOverride(slug: string): Promise<GamesOverridesMap> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq("slug", slug);
    if (error) throw new Error(`Supabase clearGameOverride: ${error.message}`);
    return readGamesOverrides();
  }
  const current = await readGamesOverrides();
  delete current[slug];
  await writeJson(OVERRIDES_FILE, current);
  return current;
}

export function applyOverride(
  game: Game,
  override: GameOverride | undefined
): Game & { runtimeStatus: GameRuntimeStatus } {
  const defaultStatus: GameRuntimeStatus =
    game.status === "active" ? "active" : game.status === "hidden" ? "hidden" : "frozen";
  return {
    ...game,
    name: override?.name ?? game.name,
    shortDescription: override?.shortDescription ?? game.shortDescription,
    themeColor: override?.themeColor ?? game.themeColor,
    runtimeStatus: override?.status ?? defaultStatus
  };
}

export async function getMergedGames(): Promise<Array<Game & { runtimeStatus: GameRuntimeStatus }>> {
  const overrides = await readGamesOverrides();
  return GAMES.map((g) => applyOverride(g, overrides[g.slug]));
}

export async function getMergedGameBySlug(slug: string) {
  const overrides = await readGamesOverrides();
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) return undefined;
  return applyOverride(game, overrides[slug]);
}
