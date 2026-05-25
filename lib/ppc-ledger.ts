"use client";

// Wrapper client do PPC ledger. Lê do servidor (Supabase).
// Mutações de saldo NÃO acontecem aqui — passam pelos endpoints da API
// que chamam lib/wallet-server-storage.ts no servidor.

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
  recipientNick?: string;
  type: PpcLedgerType;
  amount: number;
  direction: "in" | "out";
  source: string;
  note: string;
  createdAt: string;
};

let cache: PpcLedgerEntry[] | null = null;
let inflight: Promise<PpcLedgerEntry[]> | null = null;

/** Puxa as últimas N transações da API. Dedupe de chamadas paralelas. */
export async function fetchPpcLedger(limit = 100): Promise<PpcLedgerEntry[]> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`/api/wallet/transactions?limit=${limit}`, { cache: "no-store" });
      const data = await res.json();
      const list = Array.isArray(data?.transactions) ? data.transactions : [];
      cache = list as PpcLedgerEntry[];
      return cache;
    } catch {
      cache = [];
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Leitura síncrona — usa cache. Chama fetchPpcLedger() antes. */
export function readPpcLedger(): PpcLedgerEntry[] {
  return cache ?? [];
}

export function clearPpcLedgerCache() {
  cache = null;
}

/**
 * @deprecated escritas devem ir pra endpoints API que usam credit/debit do
 * wallet-server-storage. Esse stub ficou pra não quebrar imports legados.
 * Vai pro console.warn em dev se for chamado.
 */
export function writePpcLedger(_list: PpcLedgerEntry[]): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[ppc-ledger] writePpcLedger é deprecated. Use APIs server-side.");
  }
}

/**
 * @deprecated escritas devem passar pelo server. Esse stub adiciona ao cache
 * local apenas (não persiste). Não usar em código novo.
 */
export function appendPpcLedgerEntry(entry: Omit<PpcLedgerEntry, "id" | "createdAt">): PpcLedgerEntry {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[ppc-ledger] appendPpcLedgerEntry é deprecated. Server cuida disso agora.");
  }
  const next: PpcLedgerEntry = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...entry
  };
  if (cache) cache = [next, ...cache];
  return next;
}

function isWithinDays(createdAt: string, days: number) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function sumEntries(entries: PpcLedgerEntry[], filter: (entry: PpcLedgerEntry) => boolean) {
  return entries.filter(filter).reduce((sum, entry) => sum + entry.amount, 0);
}

export function getPpcMetrics() {
  const entries = readPpcLedger();
  const periods = [
    { id: "day", days: 1, label: "Hoje" },
    { id: "week", days: 7, label: "Semana" },
    { id: "month", days: 30, label: "Mês" }
  ] as const;

  return periods.map((period) => {
    const filtered = entries.filter((entry) => isWithinDays(entry.createdAt, period.days));
    return {
      id: period.id,
      label: period.label,
      bought: sumEntries(filtered, (entry) => entry.type === "purchase" && entry.direction === "in"),
      used: sumEntries(filtered, (entry) => entry.direction === "out"),
      returned: sumEntries(filtered, (entry) => entry.type === "bet_refund" && entry.direction === "in"),
      credited: sumEntries(filtered, (entry) => entry.direction === "in"),
      transactions: filtered.length
    };
  });
}
