"use client";

export type PpcLedgerType =
  | "purchase"
  | "manual_credit"
  | "manual_debit"
  | "bet_stake"
  | "bet_payout"
  | "bet_refund"
  | "tournament_fee"
  | "withdraw_request"
  | "withdraw_paid"
  | "withdraw_refund";

export type PpcLedgerEntry = {
  id: string;
  type: PpcLedgerType;
  amount: number;
  direction: "in" | "out";
  source: string;
  note: string;
  createdAt: string;
};

const PPC_LEDGER_KEY = "ppb_ppc_ledger_v1";

function normalizeEntry(input: unknown): PpcLedgerEntry | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Partial<PpcLedgerEntry>;

  if (
    typeof item.id !== "string" ||
    typeof item.type !== "string" ||
    typeof item.amount !== "number" ||
    typeof item.direction !== "string" ||
    typeof item.source !== "string" ||
    typeof item.note !== "string" ||
    typeof item.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    type: item.type as PpcLedgerType,
    amount: item.amount,
    direction: item.direction === "out" ? "out" : "in",
    source: item.source,
    note: item.note,
    createdAt: item.createdAt
  };
}

export function readPpcLedger() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PPC_LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean) as PpcLedgerEntry[];
  } catch {
    return [];
  }
}

export function writePpcLedger(list: PpcLedgerEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PPC_LEDGER_KEY, JSON.stringify(list));
}

export function appendPpcLedgerEntry(entry: Omit<PpcLedgerEntry, "id" | "createdAt">) {
  const current = readPpcLedger();
  const next: PpcLedgerEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry
  };

  writePpcLedger([next, ...current]);
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
    { id: "month", days: 30, label: "Mes" }
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
