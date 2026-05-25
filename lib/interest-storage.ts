import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Storage de "interesse" — clicks em jogos congelados + sugestões de novos jogos.
// Backend automático:
// - SUPABASE_SERVICE_ROLE_KEY definido → tables Supabase (interest_clicks, game_suggestions)
// - Sem variável → arquivos JSON em /data/ (modo dev)
//
// SQL das tables está em docs/SUPABASE_MIGRATION.md

const DATA_DIR = path.join(process.cwd(), "data");
const GAMES_STATUS_FILE = path.join(DATA_DIR, "games-status.json");
const CLICKS_FILE = path.join(DATA_DIR, "interest-clicks.json");
const SUGGESTIONS_FILE = path.join(DATA_DIR, "game-suggestions.json");

export type GameFrozenStatus = "active" | "frozen" | "hidden";

export type InterestClick = {
  id: string;
  gameSlug: string;
  nick: string;
  tag: string;
  createdAt: string;
};

export type GameSuggestion = {
  id: string;
  gameName: string;
  nick: string;
  tag: string;
  createdAt: string;
};

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

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function sanitize(value: unknown, max = 80) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function shouldUseSupabase(): boolean {
  return isSupabaseAdminConfigured();
}

// ─────────────── STATUS (legacy compat) ───────────────
// Status agora vive em games-overrides-storage.ts. Esta função mantém compat
// pra leitura antiga (caso algo importe daqui).

export async function readGamesStatus(): Promise<Record<string, GameFrozenStatus>> {
  return readJson<Record<string, GameFrozenStatus>>(GAMES_STATUS_FILE, {});
}

export async function setGameStatus(slug: string, status: GameFrozenStatus) {
  const current = await readGamesStatus();
  current[slug] = status;
  await writeJson(GAMES_STATUS_FILE, current);
  return current;
}

// ─────────────── CLICKS ───────────────

export async function readClicks(): Promise<InterestClick[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("interest_clicks")
      .select("id, game_slug, nick, tag, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Supabase readClicks: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      gameSlug: row.game_slug as string,
      nick: row.nick as string,
      tag: (row.tag as string) ?? "",
      createdAt: row.created_at as string
    }));
  }
  return readJson<InterestClick[]>(CLICKS_FILE, []);
}

export async function addClick(input: { gameSlug: string; nick: string; tag: string }) {
  const nick = sanitize(input.nick, 40);
  const tag = sanitize(input.tag, 80);
  const gameSlug = sanitize(input.gameSlug, 60);

  if (!nick || !gameSlug) {
    throw new Error("Nickname e jogo são obrigatórios");
  }

  const click: InterestClick = {
    id: randomId(),
    gameSlug,
    nick,
    tag,
    createdAt: new Date().toISOString()
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("interest_clicks").insert({
      id: click.id,
      game_slug: click.gameSlug,
      nick: click.nick,
      tag: click.tag,
      created_at: click.createdAt
    });
    if (error) throw new Error(`Supabase addClick: ${error.message}`);
    return click;
  }

  const all = await readJson<InterestClick[]>(CLICKS_FILE, []);
  all.push(click);
  await writeJson(CLICKS_FILE, all);
  return click;
}

export async function countClicksBySlug(slug: string) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from("interest_clicks")
      .select("id", { count: "exact", head: true })
      .eq("game_slug", slug);
    if (error) throw new Error(`Supabase countClicks: ${error.message}`);
    return count ?? 0;
  }
  const all = await readClicks();
  return all.filter((c) => c.gameSlug === slug).length;
}

export async function getClicksGroupedBySlug() {
  const all = await readClicks();
  const map = new Map<string, InterestClick[]>();
  for (const click of all) {
    if (!map.has(click.gameSlug)) map.set(click.gameSlug, []);
    map.get(click.gameSlug)!.push(click);
  }
  return Object.fromEntries(map.entries());
}

// ─────────────── SUGGESTIONS ───────────────

export async function readSuggestions(): Promise<GameSuggestion[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("game_suggestions")
      .select("id, game_name, nick, tag, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Supabase readSuggestions: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      gameName: row.game_name as string,
      nick: row.nick as string,
      tag: (row.tag as string) ?? "",
      createdAt: row.created_at as string
    }));
  }
  return readJson<GameSuggestion[]>(SUGGESTIONS_FILE, []);
}

export async function addSuggestion(input: { gameName: string; nick: string; tag: string }) {
  const gameName = sanitize(input.gameName, 60);
  const nick = sanitize(input.nick, 40);
  const tag = sanitize(input.tag, 80);

  if (!gameName || !nick) {
    throw new Error("Nome do jogo e nickname são obrigatórios");
  }

  const suggestion: GameSuggestion = {
    id: randomId(),
    gameName,
    nick,
    tag,
    createdAt: new Date().toISOString()
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("game_suggestions").insert({
      id: suggestion.id,
      game_name: suggestion.gameName,
      nick: suggestion.nick,
      tag: suggestion.tag,
      created_at: suggestion.createdAt
    });
    if (error) throw new Error(`Supabase addSuggestion: ${error.message}`);
    return suggestion;
  }

  const all = await readJson<GameSuggestion[]>(SUGGESTIONS_FILE, []);
  all.push(suggestion);
  await writeJson(SUGGESTIONS_FILE, all);
  return suggestion;
}

function normalizeGameName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function getSuggestionsRanked() {
  const all = await readSuggestions();
  const map = new Map<string, { displayName: string; count: number; items: GameSuggestion[] }>();
  for (const s of all) {
    const key = normalizeGameName(s.gameName);
    if (!map.has(key)) {
      map.set(key, { displayName: s.gameName, count: 0, items: [] });
    }
    const bucket = map.get(key)!;
    bucket.count += 1;
    bucket.items.push(s);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
