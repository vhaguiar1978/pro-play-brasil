import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Storage de transmissões ao vivo. Jogador marca "estou ao vivo" pelo editor
// de perfil; outros usuários veem em /ao-vivo, home, dashboard e campeonatos.
//
// Streams expiram automaticamente após TTL_HOURS sem renovação. Isso evita
// que "fantasmas" fiquem aparecendo se o jogador esquecer de desligar.
//
// Backend automático: filesystem em dev, Supabase em prod.
// SQL: ver docs/SUPABASE_MIGRATION.md (table: live_streams).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "live-streams.json");
const TABLE = "live_streams";

/** Streams ficam ativas por até 6h sem renovação. */
const TTL_HOURS = 6;

export type LiveStream = {
  nickname: string;
  gameSlug: string;
  twitchUrl: string;
  title: string;
  startedAt: string;
  updatedAt: string;
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

function isExpired(stream: LiveStream): boolean {
  const ageMs = Date.now() - new Date(stream.updatedAt).getTime();
  return ageMs > TTL_HOURS * 60 * 60 * 1000;
}

function sanitize(value: unknown, max = 120): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizeTwitchUrl(raw: string): string {
  const clean = sanitize(raw, 200);
  if (!clean) return "";
  // Se for só o usuário (sem URL), gera URL Twitch
  if (!/^https?:\/\//i.test(clean)) {
    const username = clean.replace(/[^a-z0-9_]/gi, "");
    return username ? `https://twitch.tv/${username}` : "";
  }
  return clean;
}

type DbRow = {
  nickname: string;
  game_slug: string;
  twitch_url: string;
  title: string;
  started_at: string;
  updated_at: string;
};

function rowToStream(row: DbRow): LiveStream {
  return {
    nickname: row.nickname,
    gameSlug: row.game_slug,
    twitchUrl: row.twitch_url,
    title: row.title,
    startedAt: row.started_at,
    updatedAt: row.updated_at
  };
}

// ─────────────── READ ───────────────

export async function readLiveStreams(): Promise<LiveStream[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`Supabase readLiveStreams: ${error.message}`);
    const all = (data ?? []).map((row) => rowToStream(row as DbRow));
    return all.filter((s) => !isExpired(s));
  }
  const all = await readJson<LiveStream[]>(FILE, []);
  return all.filter((s) => !isExpired(s));
}

export async function readLiveStreamsByGame(gameSlug: string): Promise<LiveStream[]> {
  const all = await readLiveStreams();
  return all.filter((s) => s.gameSlug === gameSlug);
}

export async function getLiveStreamByNickname(nickname: string): Promise<LiveStream | null> {
  const all = await readLiveStreams();
  return all.find((s) => s.nickname.toLowerCase() === nickname.toLowerCase()) ?? null;
}

// ─────────────── WRITE ───────────────

export async function upsertLiveStream(input: {
  nickname: string;
  gameSlug: string;
  twitchUrl: string;
  title: string;
}): Promise<LiveStream | { error: string }> {
  const nickname = sanitize(input.nickname, 40);
  const gameSlug = sanitize(input.gameSlug, 60);
  const twitchUrl = normalizeTwitchUrl(input.twitchUrl);
  const title = sanitize(input.title, 120);

  if (!nickname) return { error: "Nick é obrigatório" };
  if (!gameSlug) return { error: "Jogo é obrigatório" };
  if (!twitchUrl) return { error: "URL do Twitch é obrigatória" };

  const now = new Date().toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from(TABLE)
      .select("started_at")
      .eq("nickname", nickname)
      .maybeSingle();
    const startedAt = (existing as DbRow | null)?.started_at ?? now;
    const { error } = await supabase.from(TABLE).upsert({
      nickname,
      game_slug: gameSlug,
      twitch_url: twitchUrl,
      title,
      started_at: startedAt,
      updated_at: now
    });
    if (error) throw new Error(`Supabase upsertLiveStream: ${error.message}`);
    return {
      nickname,
      gameSlug,
      twitchUrl,
      title,
      startedAt,
      updatedAt: now
    };
  }

  const all = await readJson<LiveStream[]>(FILE, []);
  const existing = all.find((s) => s.nickname.toLowerCase() === nickname.toLowerCase());
  const stream: LiveStream = {
    nickname,
    gameSlug,
    twitchUrl,
    title,
    startedAt: existing?.startedAt ?? now,
    updatedAt: now
  };
  const next = all.filter((s) => s.nickname.toLowerCase() !== nickname.toLowerCase());
  next.push(stream);
  await writeJson(FILE, next);
  return stream;
}

export async function endLiveStream(nickname: string): Promise<{ ok: boolean }> {
  const nick = sanitize(nickname, 40);
  if (!nick) return { ok: false };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq("nickname", nick);
    if (error) throw new Error(`Supabase endLiveStream: ${error.message}`);
    return { ok: true };
  }
  const all = await readJson<LiveStream[]>(FILE, []);
  const next = all.filter((s) => s.nickname.toLowerCase() !== nick.toLowerCase());
  await writeJson(FILE, next);
  return { ok: true };
}
