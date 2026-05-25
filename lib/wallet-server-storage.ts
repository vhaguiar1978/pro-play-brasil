import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Storage server da carteira PPC + ledger de transações.
// Backend: filesystem em dev → Supabase em prod.
// SQL: ver docs/SUPABASE_MIGRATION.md (tables: wallets, ppc_ledger)
//
// REGRA DE OURO: NUNCA permita escrita direta de saldo pelo client.
// Toda mutação passa por essa lib server-only, com ledger registrado.

const DATA_DIR = path.join(process.cwd(), "data");
const WALLET_FILE = path.join(DATA_DIR, "wallets.json");
const LEDGER_FILE = path.join(DATA_DIR, "ppc-ledger.json");
const WALLETS_TABLE = "wallets";
const LEDGER_TABLE = "ppc_ledger";

/** Saldo inicial creditado quando um nickname é tocado pela primeira vez (gamification onboarding). */
const STARTER_BALANCE = 500;

export type Wallet = {
  nickname: string;
  balance: number;
  updatedAt: string;
};

export type PpcLedgerType =
  | "starter"
  | "purchase"
  | "manual_credit"
  | "manual_debit"
  | "bet_stake"
  | "bet_payout"
  | "bet_refund"
  | "tournament_fee"
  | "tournament_prize"
  | "withdraw_request"
  | "withdraw_paid"
  | "withdraw_refund";

export type PpcLedgerEntry = {
  id: string;
  recipientNick: string;
  type: PpcLedgerType;
  amount: number;
  direction: "in" | "out";
  source: string;
  note: string;
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

// ─────────────── ROW MAPPERS ───────────────

type WalletDbRow = {
  nickname: string;
  balance: number;
  updated_at: string;
};

type LedgerDbRow = {
  id: string;
  recipient_nick: string;
  type: PpcLedgerType;
  amount: number;
  direction: "in" | "out";
  source: string;
  note: string;
  created_at: string;
};

function rowToWallet(row: WalletDbRow): Wallet {
  return { nickname: row.nickname, balance: row.balance, updatedAt: row.updated_at };
}

function rowToLedger(row: LedgerDbRow): PpcLedgerEntry {
  return {
    id: row.id,
    recipientNick: row.recipient_nick,
    type: row.type,
    amount: row.amount,
    direction: row.direction,
    source: row.source,
    note: row.note,
    createdAt: row.created_at
  };
}

// ─────────────── READ ───────────────

/**
 * Retorna a wallet do nick. Se for o primeiro acesso, cria com saldo inicial
 * (e registra entrada "starter" no ledger). Operação idempotente.
 */
export async function getOrCreateWallet(nickname: string): Promise<Wallet> {
  const key = norm(nickname);
  if (!key) throw new Error("nickname obrigatório");

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(WALLETS_TABLE)
      .select("*")
      .eq("nickname", key)
      .maybeSingle();
    if (error) throw new Error(`Supabase getOrCreateWallet: ${error.message}`);
    if (data) return rowToWallet(data as WalletDbRow);

    // Cria com saldo inicial
    const now = new Date().toISOString();
    const fresh: WalletDbRow = { nickname: key, balance: STARTER_BALANCE, updated_at: now };
    const { error: insertErr } = await supabase.from(WALLETS_TABLE).insert(fresh);
    if (insertErr) throw new Error(`Supabase createWallet: ${insertErr.message}`);

    await insertLedgerInternal({
      recipientNick: key,
      type: "starter",
      amount: STARTER_BALANCE,
      direction: "in",
      source: "onboarding",
      note: "Saldo inicial de boas-vindas"
    });

    return rowToWallet(fresh);
  }

  const all = await readJson<Record<string, Wallet>>(WALLET_FILE, {});
  if (all[key]) return all[key];

  const fresh: Wallet = {
    nickname: key,
    balance: STARTER_BALANCE,
    updatedAt: new Date().toISOString()
  };
  all[key] = fresh;
  await writeJson(WALLET_FILE, all);

  await insertLedgerInternal({
    recipientNick: key,
    type: "starter",
    amount: STARTER_BALANCE,
    direction: "in",
    source: "onboarding",
    note: "Saldo inicial de boas-vindas"
  });

  return fresh;
}

export async function readLedger(nickname: string, limit = 100): Promise<PpcLedgerEntry[]> {
  const key = norm(nickname);
  if (!key) return [];

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(LEDGER_TABLE)
      .select("*")
      .eq("recipient_nick", key)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase readLedger: ${error.message}`);
    return (data ?? []).map((row) => rowToLedger(row as LedgerDbRow));
  }

  const all = await readJson<PpcLedgerEntry[]>(LEDGER_FILE, []);
  return all
    .filter((e) => norm(e.recipientNick) === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// ─────────────── WRITE (internas) ───────────────

async function insertLedgerInternal(
  input: Omit<PpcLedgerEntry, "id" | "createdAt">
): Promise<PpcLedgerEntry> {
  const entry: PpcLedgerEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
    recipientNick: norm(input.recipientNick)
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const row: LedgerDbRow = {
      id: entry.id,
      recipient_nick: entry.recipientNick,
      type: entry.type,
      amount: entry.amount,
      direction: entry.direction,
      source: entry.source,
      note: entry.note,
      created_at: entry.createdAt
    };
    const { error } = await supabase.from(LEDGER_TABLE).insert(row);
    if (error) throw new Error(`Supabase insertLedger: ${error.message}`);
    return entry;
  }

  const all = await readJson<PpcLedgerEntry[]>(LEDGER_FILE, []);
  all.push(entry);
  await writeJson(LEDGER_FILE, all);
  return entry;
}

async function updateBalance(nickname: string, newBalance: number): Promise<Wallet> {
  const key = norm(nickname);
  const now = new Date().toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(WALLETS_TABLE)
      .update({ balance: newBalance, updated_at: now })
      .eq("nickname", key)
      .select()
      .single();
    if (error) throw new Error(`Supabase updateBalance: ${error.message}`);
    return rowToWallet(data as WalletDbRow);
  }

  const all = await readJson<Record<string, Wallet>>(WALLET_FILE, {});
  all[key] = { nickname: key, balance: newBalance, updatedAt: now };
  await writeJson(WALLET_FILE, all);
  return all[key];
}

// ─────────────── API PÚBLICA: credit/debit transacionais ───────────────

/**
 * Credita PPC no nick. Sempre cria entrada no ledger. Operação atômica
 * (em prod com Supabase, idealmente passaria por uma RPC, mas pra esse
 * volume inicial a sequência getOrCreate + update + insert serve).
 */
export async function credit(input: {
  nickname: string;
  amount: number;
  type: PpcLedgerType;
  source: string;
  note: string;
}): Promise<{ wallet: Wallet; entry: PpcLedgerEntry }> {
  if (input.amount <= 0) throw new Error("amount deve ser > 0");
  const current = await getOrCreateWallet(input.nickname);
  const wallet = await updateBalance(input.nickname, current.balance + input.amount);
  const entry = await insertLedgerInternal({
    recipientNick: input.nickname,
    type: input.type,
    amount: input.amount,
    direction: "in",
    source: input.source,
    note: input.note
  });
  return { wallet, entry };
}

/**
 * Debita PPC do nick. Falha se saldo insuficiente — retorna { error } em vez
 * de lançar, pra UI tratar o "saldo insuficiente" sem stack trace.
 */
export async function debit(input: {
  nickname: string;
  amount: number;
  type: PpcLedgerType;
  source: string;
  note: string;
}): Promise<{ wallet: Wallet; entry: PpcLedgerEntry } | { error: string }> {
  if (input.amount <= 0) return { error: "amount deve ser > 0" };
  const current = await getOrCreateWallet(input.nickname);
  if (current.balance < input.amount) {
    return { error: `Saldo insuficiente. Atual: ${current.balance} PPC.` };
  }
  const wallet = await updateBalance(input.nickname, current.balance - input.amount);
  const entry = await insertLedgerInternal({
    recipientNick: input.nickname,
    type: input.type,
    amount: input.amount,
    direction: "out",
    source: input.source,
    note: input.note
  });
  return { wallet, entry };
}
