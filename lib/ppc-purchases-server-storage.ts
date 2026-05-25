import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Registro de compras de PPC. NÃO armazena dados sensíveis de pagamento
// (número de cartão, CVV, etc). Só metadados: package_id, valor, status,
// mp_payment_id pra rastreabilidade.
//
// SQL: ver docs/SUPABASE_MIGRATION.md (table: ppc_purchases)

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "ppc-purchases.json");
const TABLE = "ppc_purchases";

export type PurchaseStatus = "pending" | "approved" | "rejected" | "refunded";

export type PpcPurchase = {
  id: string;
  nickname: string;
  packageId: string;
  amountPpc: number;       // PPC total a creditar (base + bônus)
  amountBrl: number;       // R$ cobrado
  status: PurchaseStatus;
  /** ID do pagamento no Mercado Pago. Preenchido quando webhook confirma. */
  mpPaymentId: string | null;
  /** ID da preference (checkout URL). Preenchido no checkout. */
  mpPreferenceId: string | null;
  createdAt: string;
  updatedAt: string;
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
  id: string;
  nickname: string;
  package_id: string;
  amount_ppc: number;
  amount_brl: number;
  status: PurchaseStatus;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  created_at: string;
  updated_at: string;
};

function rowToPurchase(row: DbRow): PpcPurchase {
  return {
    id: row.id,
    nickname: row.nickname,
    packageId: row.package_id,
    amountPpc: row.amount_ppc,
    amountBrl: Number(row.amount_brl),
    status: row.status,
    mpPaymentId: row.mp_payment_id,
    mpPreferenceId: row.mp_preference_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function purchaseToRow(p: PpcPurchase): DbRow {
  return {
    id: p.id,
    nickname: p.nickname,
    package_id: p.packageId,
    amount_ppc: p.amountPpc,
    amount_brl: p.amountBrl,
    status: p.status,
    mp_payment_id: p.mpPaymentId,
    mp_preference_id: p.mpPreferenceId,
    created_at: p.createdAt,
    updated_at: p.updatedAt
  };
}

// ─────────────── CREATE ───────────────

export async function createPurchase(input: {
  nickname: string;
  packageId: string;
  amountPpc: number;
  amountBrl: number;
}): Promise<PpcPurchase> {
  const now = new Date().toISOString();
  const purchase: PpcPurchase = {
    id: randomUUID(),
    nickname: norm(input.nickname),
    packageId: input.packageId,
    amountPpc: input.amountPpc,
    amountBrl: input.amountBrl,
    status: "pending",
    mpPaymentId: null,
    mpPreferenceId: null,
    createdAt: now,
    updatedAt: now
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).insert(purchaseToRow(purchase));
    if (error) throw new Error(`Supabase createPurchase: ${error.message}`);
    return purchase;
  }

  const all = await readJson<PpcPurchase[]>(FILE, []);
  all.push(purchase);
  await writeJson(FILE, all);
  return purchase;
}

// ─────────────── UPDATE (apenas internos) ───────────────

export async function setPreferenceId(id: string, preferenceId: string): Promise<void> {
  const now = new Date().toISOString();
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(TABLE)
      .update({ mp_preference_id: preferenceId, updated_at: now })
      .eq("id", id);
    if (error) throw new Error(`Supabase setPreferenceId: ${error.message}`);
    return;
  }
  const all = await readJson<PpcPurchase[]>(FILE, []);
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], mpPreferenceId: preferenceId, updatedAt: now };
    await writeJson(FILE, all);
  }
}

export async function markPurchaseApproved(id: string, mpPaymentId: string): Promise<PpcPurchase | null> {
  const now = new Date().toISOString();
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: "approved", mp_payment_id: mpPaymentId, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`Supabase markPurchaseApproved: ${error.message}`);
    return data ? rowToPurchase(data as DbRow) : null;
  }
  const all = await readJson<PpcPurchase[]>(FILE, []);
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status: "approved", mpPaymentId, updatedAt: now };
  await writeJson(FILE, all);
  return all[idx];
}

export async function markPurchaseStatus(id: string, status: PurchaseStatus): Promise<void> {
  const now = new Date().toISOString();
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(TABLE)
      .update({ status, updated_at: now })
      .eq("id", id);
    if (error) throw new Error(`Supabase markPurchaseStatus: ${error.message}`);
    return;
  }
  const all = await readJson<PpcPurchase[]>(FILE, []);
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], status, updatedAt: now };
    await writeJson(FILE, all);
  }
}

// ─────────────── READ ───────────────

export async function getPurchaseById(id: string): Promise<PpcPurchase | null> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Supabase getPurchaseById: ${error.message}`);
    return data ? rowToPurchase(data as DbRow) : null;
  }
  const all = await readJson<PpcPurchase[]>(FILE, []);
  return all.find((p) => p.id === id) ?? null;
}

export async function listPurchasesByNick(nickname: string, limit = 50): Promise<PpcPurchase[]> {
  const key = norm(nickname);
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("nickname", key)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase listPurchasesByNick: ${error.message}`);
    return (data ?? []).map((row) => rowToPurchase(row as DbRow));
  }
  const all = await readJson<PpcPurchase[]>(FILE, []);
  return all
    .filter((p) => norm(p.nickname) === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
