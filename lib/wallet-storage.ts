"use client";

export type Wallet = { balance: number; updatedAt: string };

export const WALLET_KEY = "ppb_wallet_v1";

export function defaultWallet(): Wallet {
  return { balance: 500, updatedAt: new Date().toISOString() };
}

export function readWallet(): Wallet {
  if (typeof window === "undefined") return defaultWallet();

  try {
    const raw = window.localStorage.getItem(WALLET_KEY);
    if (!raw) return defaultWallet();
    const parsed = JSON.parse(raw) as Wallet;
    if (!parsed || typeof parsed.balance !== "number") {
      return defaultWallet();
    }
    return parsed;
  } catch {
    return defaultWallet();
  }
}

export function writeWallet(wallet: Wallet) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}
