import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Storage server de inscrições em campeonato.
// Backend automático: filesystem (dev) → Supabase em prod.
// SQL: ver docs/SUPABASE_MIGRATION.md (table: tournament_registrations).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "tournament-registrations.json");
const TABLE = "tournament_registrations";

export type ServerRegistration = {
  tournamentId: string;
  nickname: string;
  teamName: string;
  platform: string;
  whatsapp: string;
  paymentMethod: "free" | "mercado_pago" | "pagseguro" | "ppc";
  paymentStatus: "free" | "paid";
  createdAt: string;
};

function shouldUseSupabase(): boolean {
  return isSupabaseAdminConfigured();
}

function norm(value: string): string {
  return value.trim().toLowerCase();
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
  tournament_id: string;
  nickname: string;
  team_name: string | null;
  platform: string;
  whatsapp: string;
  payment_method: ServerRegistration["paymentMethod"];
  payment_status: ServerRegistration["paymentStatus"];
  created_at: string;
};

function rowToReg(row: DbRow): ServerRegistration {
  return {
    tournamentId: row.tournament_id,
    nickname: row.nickname,
    teamName: row.team_name ?? "",
    platform: row.platform,
    whatsapp: row.whatsapp,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    createdAt: row.created_at
  };
}

function regToRow(r: ServerRegistration): DbRow {
  return {
    tournament_id: r.tournamentId,
    nickname: r.nickname,
    team_name: r.teamName || null,
    platform: r.platform,
    whatsapp: r.whatsapp,
    payment_method: r.paymentMethod,
    payment_status: r.paymentStatus,
    created_at: r.createdAt
  };
}

export async function readRegistrationsByTournament(tournamentId: string): Promise<ServerRegistration[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Supabase readRegistrations: ${error.message}`);
    return (data ?? []).map((row) => rowToReg(row as DbRow));
  }
  const all = await readJson<ServerRegistration[]>(FILE, []);
  return all.filter((r) => r.tournamentId === tournamentId);
}

export async function isAlreadyRegistered(tournamentId: string, nickname: string): Promise<boolean> {
  const all = await readRegistrationsByTournament(tournamentId);
  return all.some((r) => norm(r.nickname) === norm(nickname));
}

export async function addRegistration(input: {
  tournamentId: string;
  nickname: string;
  teamName?: string;
  platform: string;
  whatsapp: string;
  paymentMethod?: ServerRegistration["paymentMethod"];
  paymentStatus?: ServerRegistration["paymentStatus"];
}): Promise<ServerRegistration | { error: string }> {
  const tournamentId = input.tournamentId.trim();
  const nickname = input.nickname.trim();
  const platform = input.platform.trim();
  const whatsapp = input.whatsapp.trim();

  if (!tournamentId) return { error: "Campeonato é obrigatório" };
  if (!nickname) return { error: "Nickname é obrigatório" };
  if (!platform) return { error: "Plataforma é obrigatória" };
  if (!whatsapp) return { error: "WhatsApp é obrigatório" };

  if (await isAlreadyRegistered(tournamentId, nickname)) {
    return { error: "Esse nickname já está inscrito neste campeonato" };
  }

  const registration: ServerRegistration = {
    tournamentId,
    nickname: nickname.slice(0, 40),
    teamName: (input.teamName ?? "").trim().slice(0, 60),
    platform: platform.slice(0, 40),
    whatsapp: whatsapp.slice(0, 30),
    paymentMethod: input.paymentMethod ?? "free",
    paymentStatus: input.paymentStatus ?? (input.paymentMethod && input.paymentMethod !== "free" ? "free" : "free"),
    createdAt: new Date().toISOString()
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).insert(regToRow(registration));
    if (error) throw new Error(`Supabase addRegistration: ${error.message}`);
    return registration;
  }
  const all = await readJson<ServerRegistration[]>(FILE, []);
  all.push(registration);
  await writeJson(FILE, all);
  return registration;
}

export async function removeRegistration(tournamentId: string, nickname: string): Promise<{ ok: boolean }> {
  const key = norm(nickname);
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("tournament_id", tournamentId)
      .ilike("nickname", nickname);
    if (error) throw new Error(`Supabase removeRegistration: ${error.message}`);
    return { ok: true };
  }
  const all = await readJson<ServerRegistration[]>(FILE, []);
  const next = all.filter(
    (r) => !(r.tournamentId === tournamentId && norm(r.nickname) === key)
  );
  await writeJson(FILE, next);
  return { ok: true };
}

export async function countRegistrations(tournamentId: string): Promise<number> {
  const all = await readRegistrationsByTournament(tournamentId);
  return all.length;
}
