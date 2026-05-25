import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Selo de campeão — é diferente do avatar de perfil.
// Só player com selo "active" pode ter logoUrl exibido ao lado do nome.
// Concedido automaticamente ao vencer uma final, ou manualmente pelo admin.
// SQL: ver docs/SUPABASE_MIGRATION.md (table: player_badges).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "player-badges.json");
const TABLE = "player_badges";

export type BadgeGrantSource = "champion" | "admin";

export type PlayerBadge = {
  nickname: string;
  logoUrl: string | null;
  grantedBy: BadgeGrantSource;
  grantedAt: string;
  grantedReason?: string;
  /** Quando false, o selo fica pausado (não aparece nas listas). */
  active: boolean;
  updatedAt: string;
};

function shouldUseSupabase(): boolean {
  return isSupabaseAdminConfigured();
}

function norm(nick: string): string {
  return nick.trim().toLowerCase();
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

type DbRow = {
  nickname: string;
  logo_url: string | null;
  granted_by: BadgeGrantSource;
  granted_at: string;
  granted_reason: string | null;
  active: boolean;
  updated_at: string;
};

function rowToBadge(row: DbRow): PlayerBadge {
  return {
    nickname: row.nickname,
    logoUrl: row.logo_url,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    grantedReason: row.granted_reason ?? undefined,
    active: row.active,
    updatedAt: row.updated_at
  };
}

function badgeToRow(b: PlayerBadge): DbRow {
  return {
    nickname: b.nickname,
    logo_url: b.logoUrl,
    granted_by: b.grantedBy,
    granted_at: b.grantedAt,
    granted_reason: b.grantedReason ?? null,
    active: b.active,
    updated_at: b.updatedAt
  };
}

// ─────────────── READ ───────────────

export async function readAllBadges(): Promise<PlayerBadge[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw new Error(`Supabase readAllBadges: ${error.message}`);
    return (data ?? []).map((row) => rowToBadge(row as DbRow));
  }
  const all = await readJson<PlayerBadge[]>(FILE, []);
  return all;
}

export async function getBadge(nickname: string): Promise<PlayerBadge | null> {
  const key = norm(nickname);
  if (!key) return null;
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from(TABLE).select("*").eq("nickname", key).maybeSingle();
    return data ? rowToBadge(data as DbRow) : null;
  }
  const all = await readAllBadges();
  return all.find((b) => norm(b.nickname) === key) ?? null;
}

/** Retorna mapa nick → logo_url APENAS pros ativos com logo. Usado pelas listas. */
export async function getActiveBadgeLogos(nicks: string[]): Promise<Record<string, string>> {
  const all = await readAllBadges();
  const keys = new Set(nicks.map(norm));
  const out: Record<string, string> = {};
  for (const b of all) {
    const key = norm(b.nickname);
    if (!keys.has(key)) continue;
    if (!b.active) continue;
    if (!b.logoUrl) continue;
    out[key] = b.logoUrl;
  }
  return out;
}

// ─────────────── WRITE ───────────────

async function persist(badge: PlayerBadge): Promise<void> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).upsert(badgeToRow(badge));
    if (error) throw new Error(`Supabase persist badge: ${error.message}`);
    return;
  }
  const all = await readJson<PlayerBadge[]>(FILE, []);
  const key = norm(badge.nickname);
  const idx = all.findIndex((b) => norm(b.nickname) === key);
  if (idx >= 0) all[idx] = badge;
  else all.push(badge);
  await writeJson(FILE, all);
}

/** Libera o selo. Se já existir, reativa (preserva logoUrl). */
export async function grantBadge(input: {
  nickname: string;
  grantedBy: BadgeGrantSource;
  reason?: string;
}): Promise<PlayerBadge> {
  const nickname = input.nickname.trim();
  const key = norm(nickname);
  if (!key) throw new Error("Nickname vazio");
  const existing = await getBadge(nickname);
  const now = new Date().toISOString();
  const badge: PlayerBadge = {
    nickname: existing?.nickname ?? nickname,
    logoUrl: existing?.logoUrl ?? null,
    grantedBy: existing?.grantedBy ?? input.grantedBy,
    grantedAt: existing?.grantedAt ?? now,
    grantedReason: existing?.grantedReason ?? input.reason,
    active: true,
    updatedAt: now
  };
  await persist(badge);
  return badge;
}

/** Pausa (active=false) ou ativa o selo. Mantém o logoUrl pro player não perder. */
export async function setBadgeActive(nickname: string, active: boolean): Promise<PlayerBadge | null> {
  const existing = await getBadge(nickname);
  if (!existing) return null;
  const updated: PlayerBadge = {
    ...existing,
    active,
    updatedAt: new Date().toISOString()
  };
  await persist(updated);
  return updated;
}

/** Remove o selo de vez (incluindo logoUrl). */
export async function revokeBadge(nickname: string): Promise<void> {
  const key = norm(nickname);
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq("nickname", key);
    if (error) throw new Error(`Supabase revokeBadge: ${error.message}`);
    return;
  }
  const all = await readJson<PlayerBadge[]>(FILE, []);
  const next = all.filter((b) => norm(b.nickname) !== key);
  await writeJson(FILE, next);
}

/** Atualiza só o logoUrl (chamado pelo upload). Exige badge existente e ativo. */
export async function setBadgeLogo(nickname: string, logoUrl: string): Promise<PlayerBadge | { error: string }> {
  const existing = await getBadge(nickname);
  if (!existing) return { error: "Você ainda não tem selo de campeão liberado" };
  if (!existing.active) return { error: "Seu selo está pausado" };
  const updated: PlayerBadge = {
    ...existing,
    logoUrl,
    updatedAt: new Date().toISOString()
  };
  await persist(updated);
  return updated;
}
