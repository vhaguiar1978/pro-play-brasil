import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Storage server de avatares dos jogadores.
// Mapeia nickname (lowercase) → URL da imagem.
// Backend automático: filesystem (dev) → Supabase em prod.
// SQL: ver docs/SUPABASE_MIGRATION.md (table: player_avatars).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "player-avatars.json");
const TABLE = "player_avatars";

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

function norm(nick: string): string {
  return nick.trim().toLowerCase();
}

type AvatarsMap = Record<string, string>;

export async function readAvatars(): Promise<AvatarsMap> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(TABLE).select("nickname, avatar_url");
    if (error) throw new Error(`Supabase readAvatars: ${error.message}`);
    const map: AvatarsMap = {};
    for (const row of data ?? []) {
      map[norm((row as { nickname: string }).nickname)] = (row as { avatar_url: string }).avatar_url;
    }
    return map;
  }
  return readJson<AvatarsMap>(FILE, {});
}

export async function getAvatarUrl(nickname: string): Promise<string | null> {
  const all = await readAvatars();
  return all[norm(nickname)] ?? null;
}

export async function getAvatarsBatch(nicks: string[]): Promise<AvatarsMap> {
  const all = await readAvatars();
  const out: AvatarsMap = {};
  for (const n of nicks) {
    const key = norm(n);
    if (all[key]) out[key] = all[key];
  }
  return out;
}

export async function setAvatarUrl(nickname: string, url: string): Promise<void> {
  const key = norm(nickname);
  if (!key) throw new Error("Nickname vazio");

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).upsert({
      nickname: key,
      avatar_url: url,
      updated_at: new Date().toISOString()
    });
    if (error) throw new Error(`Supabase setAvatarUrl: ${error.message}`);
    return;
  }
  const all = await readJson<AvatarsMap>(FILE, {});
  all[key] = url;
  await writeJson(FILE, all);
}

export async function removeAvatar(nickname: string): Promise<void> {
  const key = norm(nickname);
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq("nickname", key);
    if (error) throw new Error(`Supabase removeAvatar: ${error.message}`);
    return;
  }
  const all = await readJson<AvatarsMap>(FILE, {});
  delete all[key];
  await writeJson(FILE, all);
}
