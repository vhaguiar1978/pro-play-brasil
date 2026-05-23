"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { appendPpcLedgerEntry, readPpcLedger } from "@/lib/ppc-ledger";
import { upsertTournamentRegistration } from "@/lib/tournament-registration";
import { readWallet, writeWallet } from "@/lib/wallet-storage";

type TournamentRegistrationPayload = {
  tournamentId: string;
  nickname: string;
  teamName: string;
  platform: string;
  whatsapp: string;
  paymentMethod: "mercado_pago";
  paymentStatus: "paid";
  createdAt: string;
};

type ConfirmResponse = {
  ok: boolean;
  message?: string;
  kind?: "ppc_purchase" | "tournament_fee";
  coins?: number;
  paymentId?: string;
  alreadyProcessed?: boolean;
  registration?: TournamentRegistrationPayload;
};

type Props = {
  status?: string;
  paymentId?: string;
  collectionId?: string;
};

const PROCESSED_PAYMENT_KEY = "ppb_processed_payments_v1";

function readProcessedPayments() {
  if (typeof window === "undefined") return [] as string[];

  try {
    const raw = window.localStorage.getItem(PROCESSED_PAYMENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function markPaymentProcessed(paymentId: string) {
  if (typeof window === "undefined") return;
  const current = readProcessedPayments();
  if (current.includes(paymentId)) return;
  window.localStorage.setItem(PROCESSED_PAYMENT_KEY, JSON.stringify([paymentId, ...current]));
}

function hasLocalPayment(paymentId: string) {
  return readProcessedPayments().includes(paymentId);
}

export function PaymentReturnStatus({ status, paymentId, collectionId }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(status === "success");
  const [resolvedKind, setResolvedKind] = useState<ConfirmResponse["kind"]>();
  const [resolvedTournamentId, setResolvedTournamentId] = useState<string | null>(null);

  useEffect(() => {
    const paymentRef = paymentId || collectionId;
    if (status !== "success" || !paymentRef) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function confirmPayment() {
      try {
        const response = await fetch("/api/payments/mercado-pago/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            paymentId,
            collectionId
          })
        });

        const data = (await response.json()) as ConfirmResponse;
        if (cancelled) return;

        if (!response.ok || !data.ok) {
          setMessage(data.message ?? "Nao foi possivel confirmar o pagamento automaticamente.");
          return;
        }

        if (data.kind === "ppc_purchase" && data.paymentId && typeof data.coins === "number") {
          setResolvedKind("ppc_purchase");

          if (!hasLocalPayment(data.paymentId)) {
            const wallet = readWallet();
            writeWallet({
              balance: wallet.balance + data.coins,
              updatedAt: new Date().toISOString()
            });

            const localLedgerExists = readPpcLedger().some((entry) => entry.source === `mercado-pago:${data.paymentId}`);
            if (!localLedgerExists) {
              appendPpcLedgerEntry({
                type: "purchase",
                amount: data.coins,
                direction: "in",
                source: `mercado-pago:${data.paymentId}`,
                note: `Compra aprovada via Mercado Pago (${data.coins} PPC)`
              });
            }

            markPaymentProcessed(data.paymentId);
          }

          setMessage(
            data.alreadyProcessed
              ? "Pagamento confirmado. O saldo em PPC ja estava creditado na sua conta."
              : `Pagamento confirmado. ${data.coins} PPC foram creditados na sua conta.`
          );
          return;
        }

        if (data.kind === "tournament_fee" && data.registration && data.paymentId) {
          setResolvedKind("tournament_fee");
          setResolvedTournamentId(data.registration.tournamentId);

          if (!hasLocalPayment(data.paymentId)) {
            upsertTournamentRegistration(data.registration);
            markPaymentProcessed(data.paymentId);
          }

          setMessage(
            data.alreadyProcessed
              ? "Pagamento confirmado. A inscricao desse campeonato ja estava registrada para voce."
              : "Pagamento confirmado. Sua inscricao no campeonato ja foi registrada."
          );
          return;
        }

        setMessage("Pagamento confirmado, mas o sistema nao reconheceu o tipo dessa operacao.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao confirmar o pagamento no retorno.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [collectionId, paymentId, status]);

  return (
    <div className="card soft">
      <div className="stack">
        <h2 style={{ margin: 0 }}>Conciliacao do pagamento</h2>
        <p className="muted" style={{ margin: 0 }}>
          {loading
            ? "Estamos conferindo o retorno do Mercado Pago e aplicando o efeito correto no sistema."
            : message ?? "O retorno do gateway foi processado."}
        </p>

        <div className="inline-actions">
          <Link href="/arena/moedas" className="btn btn-primary">
            Ver minha carteira PPC
          </Link>
          {resolvedKind === "tournament_fee" && resolvedTournamentId ? (
            <Link href={`/campeonatos/${resolvedTournamentId}`} className="btn btn-secondary">
              Ver campeonato
            </Link>
          ) : (
            <Link href="/campeonatos" className="btn btn-secondary">
              Ir para campeonatos
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
