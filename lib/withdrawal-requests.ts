"use client";

import { appendPpcLedgerEntry } from "@/lib/ppc-ledger";
import { readWallet, writeWallet } from "@/lib/wallet-storage";

export type WithdrawalRequest = {
  id: string;
  nickname: string;
  fullName: string;
  ppcAmount: number;
  brlEstimate: number;
  pixKey: string;
  contact: string;
  createdAt: string;
  status: "pendente" | "pago" | "recusado";
  adminNote: string;
  processedAt?: string;
};

const WITHDRAWALS_KEY = "ppb_withdrawals_v1";

function normalizeRequest(input: unknown): WithdrawalRequest | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Partial<WithdrawalRequest>;

  if (
    typeof item.id !== "string" ||
    typeof item.nickname !== "string" ||
    typeof item.fullName !== "string" ||
    typeof item.ppcAmount !== "number" ||
    typeof item.brlEstimate !== "number" ||
    typeof item.pixKey !== "string" ||
    typeof item.contact !== "string" ||
    typeof item.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    nickname: item.nickname,
    fullName: item.fullName,
    ppcAmount: item.ppcAmount,
    brlEstimate: item.brlEstimate,
    pixKey: item.pixKey,
    contact: item.contact,
    createdAt: item.createdAt,
    status: item.status === "pago" || item.status === "recusado" ? item.status : "pendente",
    adminNote: typeof item.adminNote === "string" ? item.adminNote : "",
    processedAt: typeof item.processedAt === "string" ? item.processedAt : undefined
  };
}

export function readWithdrawalRequests() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(WITHDRAWALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRequest).filter(Boolean) as WithdrawalRequest[];
  } catch {
    return [];
  }
}

export function writeWithdrawalRequests(list: WithdrawalRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(list));
}

export function createWithdrawalRequest(input: Omit<WithdrawalRequest, "id" | "createdAt" | "status" | "adminNote">) {
  const current = readWithdrawalRequests();
  const next: WithdrawalRequest = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pendente",
    adminNote: "",
    ...input
  };

  writeWithdrawalRequests([next, ...current]);
  appendPpcLedgerEntry({
    type: "withdraw_request",
    amount: input.ppcAmount,
    direction: "out",
    source: next.id,
    note: `Pedido de saque de ${input.ppcAmount} PPC`
  });
  return next;
}

export function processWithdrawalRequest(requestId: string, status: "pago" | "recusado", adminNote: string) {
  const current = readWithdrawalRequests();
  const target = current.find((request) => request.id === requestId);
  if (!target) return current;

  const next = current.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status,
          adminNote: adminNote.trim(),
          processedAt: new Date().toISOString()
        }
      : request
  );

  writeWithdrawalRequests(next);

  if (status === "pago") {
    appendPpcLedgerEntry({
      type: "withdraw_paid",
      amount: target.ppcAmount,
      direction: "out",
      source: requestId,
      note: "Saque pago pelo admin"
    });
  } else {
    const wallet = readWallet();
    const nextWallet = {
      balance: wallet.balance + target.ppcAmount,
      updatedAt: new Date().toISOString()
    };
    writeWallet(nextWallet);
    appendPpcLedgerEntry({
      type: "withdraw_refund",
      amount: target.ppcAmount,
      direction: "in",
      source: requestId,
      note: "Saque recusado com estorno em PPC"
    });
  }

  return next;
}
