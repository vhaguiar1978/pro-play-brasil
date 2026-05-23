import "server-only";

import { getServerAdminAccess } from "@/lib/admin-access-server";
import { ensureCurrentProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";

export type PpcLedgerDbEntry = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  direction: "in" | "out";
  source: string;
  note: string;
  created_at: string;
};

function normalizeEntry(input: unknown): PpcLedgerDbEntry | null {
  if (!input || typeof input !== "object") return null;

  const item = input as Partial<PpcLedgerDbEntry>;
  if (
    typeof item.id !== "string" ||
    typeof item.user_id !== "string" ||
    typeof item.type !== "string" ||
    typeof item.amount !== "number" ||
    typeof item.direction !== "string" ||
    typeof item.source !== "string" ||
    typeof item.note !== "string" ||
    typeof item.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    user_id: item.user_id,
    type: item.type,
    amount: item.amount,
    direction: item.direction === "out" ? "out" : "in",
    source: item.source,
    note: item.note,
    created_at: item.created_at
  };
}

function isWithinDays(createdAt: string, days: number) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export function computePpcBalance(entries: PpcLedgerDbEntry[]) {
  return entries.reduce((sum, entry) => {
    return sum + (entry.direction === "in" ? entry.amount : -entry.amount);
  }, 0);
}

export function buildPpcMetrics(entries: PpcLedgerDbEntry[]) {
  const periods = [
    { id: "day", days: 1, label: "Hoje" },
    { id: "week", days: 7, label: "Semana" },
    { id: "month", days: 30, label: "Mes" }
  ] as const;

  return periods.map((period) => {
    const filtered = entries.filter((entry) => isWithinDays(entry.created_at, period.days));
    return {
      id: period.id,
      label: period.label,
      bought: filtered
        .filter((entry) => entry.type === "purchase" && entry.direction === "in")
        .reduce((sum, entry) => sum + entry.amount, 0),
      used: filtered
        .filter((entry) => entry.direction === "out")
        .reduce((sum, entry) => sum + entry.amount, 0),
      returned: filtered
        .filter((entry) => entry.type === "bet_refund" && entry.direction === "in")
        .reduce((sum, entry) => sum + entry.amount, 0),
      transactions: filtered.length
    };
  });
}

export async function getCurrentUserPpcLedger(limit = 500) {
  const profile = await ensureCurrentProfile();
  if (!profile?.id) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ppc_ledger")
    .select("id,user_id,type,amount,direction,source,note,created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const entries = Array.isArray(data) ? data.map(normalizeEntry).filter(Boolean) as PpcLedgerDbEntry[] : [];
  return {
    userId: profile.id,
    entries,
    balance: computePpcBalance(entries)
  };
}

export async function ensureCurrentUserLedgerEntry(entry: {
  type: string;
  amount: number;
  direction: "in" | "out";
  source: string;
  note: string;
}) {
  const profile = await ensureCurrentProfile();
  if (!profile?.id) {
    throw new Error("Usuario nao autenticado.");
  }

  const supabase = await createClient();
  const { data: existing, error: findError } = await supabase
    .from("ppc_ledger")
    .select("id,user_id,type,amount,direction,source,note,created_at")
    .eq("user_id", profile.id)
    .eq("source", entry.source)
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  const normalized = normalizeEntry(existing);
  if (normalized) {
    return {
      entry: normalized,
      alreadyProcessed: true
    };
  }

  const { data, error } = await supabase
    .from("ppc_ledger")
    .insert({
      user_id: profile.id,
      type: entry.type,
      amount: entry.amount,
      direction: entry.direction,
      source: entry.source,
      note: entry.note
    })
    .select("id,user_id,type,amount,direction,source,note,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const created = normalizeEntry(data);
  if (!created) {
    throw new Error("Nao foi possivel normalizar a movimentacao de PPC.");
  }

  return {
    entry: created,
    alreadyProcessed: false
  };
}

export async function getAdminPpcLedger(limit = 40) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) return null;

  await ensureCurrentProfile();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ppc_ledger")
    .select("id,user_id,type,amount,direction,source,note,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) ? data.map(normalizeEntry).filter(Boolean) as PpcLedgerDbEntry[] : [];
}
