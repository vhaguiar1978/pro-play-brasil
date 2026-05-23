"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateBookTotals,
  formatOdd,
  getParticipantBlockReason,
  getSelectionLabel,
  getStakeCap,
  type BetSelection,
  type BetTicket,
  type BettingMarket
} from "@/lib/betting";

type BetSlipModalProps = {
  open: boolean;
  market: BettingMarket | null;
  initialSelection: BetSelection;
  walletBalance: number;
  gamertag: string;
  bets: BetTicket[];
  onClose: () => void;
  onConfirm: (payload: { market: BettingMarket; selection: BetSelection; stake: number }) => {
    ok: boolean;
    message?: string;
  };
};

export function BetSlipModal({
  open,
  market,
  initialSelection,
  walletBalance,
  gamertag,
  bets,
  onClose,
  onConfirm
}: BetSlipModalProps) {
  const [selection, setSelection] = useState<BetSelection>(initialSelection);
  const [stake, setStake] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelection(initialSelection);
    setStake("");
    setMessage(null);
  }, [initialSelection, market, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const parsedStake = Number.parseInt(stake.replace(/\D/g, ""), 10);

  const derived = useMemo(() => {
    if (!market) return null;

    const participantBlock = gamertag ? getParticipantBlockReason(market, gamertag) : null;
    const totals = calculateBookTotals(market, bets);
    const maxStake = getStakeCap(market, selection, walletBalance, bets);
    const odd = market.odds[selection];
    const potentialReturn = Number.isFinite(parsedStake) ? parsedStake * odd : 0;

    return {
      participantBlock,
      totals,
      maxStake,
      odd,
      potentialReturn
    };
  }, [bets, gamertag, market, parsedStake, selection, walletBalance]);

  if (!open || !market || !derived) return null;

  const disabledReason =
    derived.participantBlock ??
    (!gamertag ? "Crie seu cadastro antes de apostar para o sistema validar as restricoes." : null);

  function submitBet() {
    if (!market) return;

    if (!Number.isFinite(parsedStake)) {
      setMessage("Digite um valor valido em PPC.");
      return;
    }

    const result = onConfirm({
      market,
      selection,
      stake: parsedStake
    });

    if (!result.ok) {
      setMessage(result.message ?? "Nao foi possivel confirmar a aposta.");
      return;
    }

    onClose();
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Confirmar aposta em PPC">
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: "grid", gap: 6 }}>
            <h2>Confirmar aposta em PPC</h2>
            <p className="muted" style={{ margin: 0 }}>
              {market.tournamentName} · {market.roundLabel}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            x
          </button>
        </div>

        <div className="modal-body">
          <div className="pill-row" aria-label="Escolha do lado">
            {(["playerA", "playerB"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`bet-option ${selection === option ? "active" : ""}`}
                onClick={() => setSelection(option)}
              >
                <strong>{getSelectionLabel(market, option)}</strong>
                <span>{formatOdd(market.odds[option])}</span>
              </button>
            ))}
          </div>

          <div className="grid cols-2" style={{ marginTop: 16 }}>
            <div className="card soft" style={{ padding: 16 }}>
              <strong>Valor da aposta</strong>
              <div className="field" style={{ marginTop: 10 }}>
                <label htmlFor="stake">PPC</label>
                <input
                  id="stake"
                  inputMode="numeric"
                  value={stake}
                  onChange={(event) => setStake(event.target.value)}
                  placeholder={`Minimo ${market.rules.minStake}`}
                  disabled={Boolean(disabledReason)}
                />
              </div>
              <p className="muted" style={{ margin: "10px 0 0" }}>
                Saldo atual: <strong>{walletBalance} PPC</strong>
              </p>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Limite liberado agora: <strong>{derived.maxStake} PPC</strong>
              </p>
            </div>

            <div className="card soft" style={{ padding: 16 }}>
              <strong>Resumo da selecao</strong>
              <div className="stack" style={{ marginTop: 10 }}>
                <div className="bet-summary-row">
                  <span className="muted">Escolha</span>
                  <strong>{getSelectionLabel(market, selection)}</strong>
                </div>
                <div className="bet-summary-row">
                  <span className="muted">Odd</span>
                  <strong>{formatOdd(derived.odd)}</strong>
                </div>
                <div className="bet-summary-row">
                  <span className="muted">Retorno potencial</span>
                  <strong>{Number.isFinite(parsedStake) ? `${derived.potentialReturn.toFixed(0)} PPC` : "0 PPC"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="timer-banner" style={{ marginTop: 14 }}>
            <div className="kpi">
              <strong>Travas internas da casa</strong>
              <span>
                Limite por saldo, limite por lado e bloqueio automatico quando o pior cenario chega no teto.
              </span>
            </div>
            <div className="kpi">
              <strong>{Math.round(derived.totals.worstCasePayout)} PPC</strong>
              <span>Pior payout atual do mercado</span>
            </div>
          </div>

          {disabledReason ? (
            <div className="timer-banner" style={{ marginTop: 14, borderColor: "rgba(255, 89, 94, 0.25)" }}>
              <strong style={{ color: "#be123c" }}>Bloqueio</strong>
              <span className="muted">{disabledReason}</span>
            </div>
          ) : null}

          {message ? (
            <p className="muted" role="status" style={{ marginTop: 14 }}>
              {message}
            </p>
          ) : null}

          <div className="inline-actions" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={submitBet} disabled={Boolean(disabledReason)}>
              Confirmar aposta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
