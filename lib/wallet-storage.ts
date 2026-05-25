"use client";

// Wrapper client da carteira PPC. Agora puxa do servidor (Supabase) em vez
// de localStorage. Mantém cache leve em memória pra evitar flash de loading.

export type Wallet = { balance: number; updatedAt: string };

export const WALLET_KEY = "ppb_wallet_v1";

let memoryCache: Wallet | null = null;
let inflight: Promise<Wallet> | null = null;

export function defaultWallet(): Wallet {
  return { balance: 0, updatedAt: new Date().toISOString() };
}

/**
 * Lê o saldo do server. Faz dedupe de chamadas paralelas via `inflight`.
 * Em caso de erro/sem sessão, retorna saldo zero (UI mostra "faça login pra ver").
 */
export async function fetchWallet(): Promise<Wallet> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      const data = await res.json();
      if (typeof data?.balance === "number") {
        memoryCache = { balance: data.balance, updatedAt: data.updatedAt };
        // Espelha no localStorage só pra evitar flash em next paint
        try {
          window.localStorage.setItem(WALLET_KEY, JSON.stringify(memoryCache));
        } catch {
          /* ignora */
        }
        return memoryCache;
      }
      memoryCache = defaultWallet();
      return memoryCache;
    } catch {
      memoryCache = defaultWallet();
      return memoryCache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Leitura síncrona — usa cache em memória OU localStorage espelho.
 * Pra ter saldo real, chame `fetchWallet()` antes (geralmente num useEffect).
 */
export function readWallet(): Wallet {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined") return defaultWallet();
  try {
    const raw = window.localStorage.getItem(WALLET_KEY);
    if (!raw) return defaultWallet();
    const parsed = JSON.parse(raw) as Wallet;
    if (!parsed || typeof parsed.balance !== "number") return defaultWallet();
    return parsed;
  } catch {
    return defaultWallet();
  }
}

/**
 * @deprecated o servidor é fonte de verdade. Mudanças de saldo devem passar
 * por endpoints que credit/debit no server (ex: /api/tournaments/[id]/registrations
 * já debita PPC quando paga). Este helper só atualiza o espelho local.
 */
export function writeWallet(wallet: Wallet) {
  memoryCache = wallet;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  } catch {
    /* ignora */
  }
}

/** Limpa cache local — chamado após logout. */
export function clearWalletCache() {
  memoryCache = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(WALLET_KEY);
    } catch {
      /* ignora */
    }
  }
}
