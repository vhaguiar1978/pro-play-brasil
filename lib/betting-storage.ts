"use client";

import {
  getBaseBettingMarkets,
  mergeMarketsWithAdminState,
  type BetSelection,
  type BetTicket,
  type BettingMarket,
  type BettingMarketAdminState
} from "@/lib/betting";
import { appendPpcLedgerEntry } from "@/lib/ppc-ledger";
import { defaultWallet, readWallet, writeWallet } from "@/lib/wallet-storage";

const BETS_KEY = "ppb_bets_v1";
const MARKET_STATE_KEY = "ppb_betting_market_state_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readBets(): BetTicket[] {
  const parsed = readJson<unknown>(BETS_KEY, []);
  return Array.isArray(parsed) ? (parsed as BetTicket[]) : [];
}

export function writeBets(bets: BetTicket[]) {
  writeJson(BETS_KEY, bets);
}

export function readBettingAdminStates(): BettingMarketAdminState[] {
  const parsed = readJson<unknown>(MARKET_STATE_KEY, []);
  return Array.isArray(parsed) ? (parsed as BettingMarketAdminState[]) : [];
}

export function writeBettingAdminStates(states: BettingMarketAdminState[]) {
  writeJson(MARKET_STATE_KEY, states);
}

export function readBettingMarkets(): BettingMarket[] {
  return mergeMarketsWithAdminState(getBaseBettingMarkets(), readBettingAdminStates());
}

export function upsertBettingAdminState(nextState: BettingMarketAdminState) {
  const current = readBettingAdminStates();
  const next = current.some((item) => item.marketId === nextState.marketId)
    ? current.map((item) => (item.marketId === nextState.marketId ? nextState : item))
    : [...current, nextState];

  writeBettingAdminStates(next);
  return next;
}

export function settleMarketForBrowser(marketId: string, winner: BetSelection | "cancelada") {
  const markets = readBettingMarkets();
  const market = markets.find((item) => item.id === marketId);
  if (!market) {
    return { changed: false, summary: "Mercado nao encontrado." };
  }

  const bets = readBets();
  const openTickets = bets.filter((bet) => bet.marketId === marketId && bet.status === "aberta");
  if (openTickets.length === 0) {
    return { changed: false, summary: "Nao havia apostas abertas para este mercado." };
  }

  const wallet = readWallet();
  let credited = 0;
  const settledAt = new Date().toISOString();

  const nextBets = bets.map((bet) => {
    if (bet.marketId !== marketId || bet.status !== "aberta") return bet;

    if (winner === "cancelada") {
      credited += bet.stake;
      return {
        ...bet,
        status: "cancelada" as const,
        settledAt,
        payout: bet.stake
      };
    }

    if (bet.selection === winner) {
      const payout = Number((bet.stake * bet.odds).toFixed(2));
      credited += payout;
      return {
        ...bet,
        status: "ganhou" as const,
        settledAt,
        payout
      };
    }

    return {
      ...bet,
      status: "perdeu" as const,
      settledAt,
      payout: 0
    };
  });

  writeBets(nextBets);

  const nextWallet = {
    ...wallet,
    balance: wallet.balance + credited,
    updatedAt: new Date().toISOString()
  };
  writeWallet(nextWallet);

  if (credited > 0) {
    appendPpcLedgerEntry({
      type: winner === "cancelada" ? "bet_refund" : "bet_payout",
      amount: credited,
      direction: "in",
      source: marketId,
      note: winner === "cancelada" ? "Reembolso de mercado cancelado" : "Liquidacao vencedora de apostas"
    });
  }

  return {
    changed: true,
    summary:
      winner === "cancelada"
        ? `Mercado cancelado com reembolso de ${credited.toFixed(0)} PPC.`
        : `Mercado liquidado. Total creditado: ${credited.toFixed(0)} PPC.`,
    wallet: nextWallet,
    bets: nextBets
  };
}

export function ensureWalletSeeded() {
  const wallet = readWallet();
  if (wallet.balance < 0 || !wallet.updatedAt) {
    const seeded = defaultWallet();
    writeWallet(seeded);
    return seeded;
  }
  return wallet;
}
