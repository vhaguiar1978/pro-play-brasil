// Caixa — sistema de abertura e fechamento de caixa do admin
// Persiste em localStorage como fallback; API (Supabase) usada quando disponível.

export type CashRegisterStatus = "open" | "closed";

export type CashRegisterSession = {
  id: string;
  date: string;           // YYYY-MM-DD
  openedAt: string;       // ISO datetime
  closedAt: string | null;
  openingBalance: number; // valor em reais
  closingBalance: number | null;
  notes: string;
  status: CashRegisterStatus;
};

const KEY = "ppb_cash_register_sessions";

function loadAll(): CashRegisterSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CashRegisterSession[]) : [];
  } catch {
    return [];
  }
}

function saveAll(sessions: CashRegisterSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function readCashRegisterSessions(): CashRegisterSession[] {
  return loadAll().sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
}

export function getOpenCashRegisterSession(): CashRegisterSession | null {
  return loadAll().find((s) => s.status === "open") ?? null;
}

export function openCashRegister(openingBalance: number, notes: string): CashRegisterSession {
  const sessions = loadAll();
  const existing = sessions.find((s) => s.status === "open");
  if (existing) return existing;

  const now = new Date();
  const session: CashRegisterSession = {
    id: crypto.randomUUID(),
    date: now.toISOString().slice(0, 10),
    openedAt: now.toISOString(),
    closedAt: null,
    openingBalance,
    closingBalance: null,
    notes,
    status: "open"
  };

  saveAll([session, ...sessions]);
  return session;
}

export function closeCashRegister(id: string, closingBalance: number, notes: string): boolean {
  const sessions = loadAll();
  const index = sessions.findIndex((s) => s.id === id);
  if (index < 0) return false;

  sessions[index] = {
    ...sessions[index],
    closedAt: new Date().toISOString(),
    closingBalance,
    notes: notes || sessions[index].notes,
    status: "closed"
  };

  saveAll(sessions);
  return true;
}
