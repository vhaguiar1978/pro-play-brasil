"use client";

import { useEffect, useState } from "react";
import { getHouseProtectionSnapshot, type BetSelection, type BettingMarket, type BettingMarketAdminState } from "@/lib/betting";
import {
  readBets,
  readBettingAdminStates,
  readBettingMarkets,
  settleMarketForBrowser,
  upsertBettingAdminState
} from "@/lib/betting-storage";

function getAdminStateByMarket(
  marketId: string,
  states: BettingMarketAdminState[]
): BettingMarketAdminState | undefined {
  return states.find((item) => item.marketId === marketId);
}

export function AdminBettingPanel() {
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [states, setStates] = useState<BettingMarketAdminState[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [betsCount, setBetsCount] = useState(0);

  useEffect(() => {
    setMarkets(readBettingMarkets());
    setStates(readBettingAdminStates());
    setBetsCount(readBets().length);
  }, []);

  function refresh(message?: string) {
    setMarkets(readBettingMarkets());
    setStates(readBettingAdminStates());
    setBetsCount(readBets().length);
    setFlash(message ?? null);
  }

  function saveMarket(
    market: BettingMarket,
    updates: {
      oddA: string;
      oddB: string;
      maxPayout: string;
      minStake: string;
      forceClosed: boolean;
    }
  ) {
    const previous = getAdminStateByMarket(market.id, states);
    const nextState: BettingMarketAdminState = {
      marketId: market.id,
      odds: {
        playerA: Number.parseFloat(updates.oddA) || market.odds.playerA,
        playerB: Number.parseFloat(updates.oddB) || market.odds.playerB
      },
      house: {
        maxPayout: Number.parseInt(updates.maxPayout.replace(/\D/g, ""), 10) || market.house.maxPayout
      },
      rules: {
        minStake: Number.parseInt(updates.minStake.replace(/\D/g, ""), 10) || market.rules.minStake
      },
      forceClosed: updates.forceClosed,
      settlement: previous?.settlement ?? null
    };

    upsertBettingAdminState(nextState);
    refresh(`Mercado ${market.tournamentName} atualizado.`);
  }

  function settleMarket(marketId: string, winner: BetSelection | "cancelada") {
    const previous = getAdminStateByMarket(marketId, states);
    const nextState: BettingMarketAdminState = {
      marketId,
      odds: previous?.odds,
      house: previous?.house,
      rules: previous?.rules,
      forceClosed: true,
      settlement: {
        winner,
        settledAt: new Date().toISOString()
      }
    };

    upsertBettingAdminState(nextState);
    const result = settleMarketForBrowser(marketId, winner);
    refresh(result.summary);
  }

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {flash ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>Admin</strong>
          <span className="muted">{flash}</span>
        </div>
      ) : null}

      {markets.map((market) => {
        const state = getAdminStateByMarket(market.id, states);
        const settled = state?.settlement;
        const protection = getHouseProtectionSnapshot(market, readBets());

        return (
          <form
            key={market.id}
            className="card soft"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              saveMarket(market, {
                oddA: String(form.get("oddA") ?? ""),
                oddB: String(form.get("oddB") ?? ""),
                maxPayout: String(form.get("maxPayout") ?? ""),
                minStake: String(form.get("minStake") ?? ""),
                forceClosed: form.get("forceClosed") === "on"
              });
            }}
          >
            <div className="section-head">
              <div>
                <span className={`badge ${market.status === "fechado" ? "community" : "official"}`}>
                  {market.status}
                </span>
                <h2 style={{ margin: "14px 0 6px" }}>{market.tournamentName}</h2>
                <p className="muted" style={{ margin: 0 }}>
                  {market.playerA} vs {market.playerB}
                </p>
              </div>
            </div>

            <div className="grid cols-2" style={{ marginTop: 16 }}>
              <div className="field">
                <label htmlFor={`${market.id}-oddA`}>Odd lado A</label>
                <input id={`${market.id}-oddA`} name="oddA" defaultValue={market.odds.playerA} />
              </div>
              <div className="field">
                <label htmlFor={`${market.id}-oddB`}>Odd lado B</label>
                <input id={`${market.id}-oddB`} name="oddB" defaultValue={market.odds.playerB} />
              </div>
              <div className="field">
                <label htmlFor={`${market.id}-maxPayout`}>Teto da casa (PPC)</label>
                <input id={`${market.id}-maxPayout`} name="maxPayout" defaultValue={market.house.maxPayout} />
              </div>
              <div className="field">
                <label htmlFor={`${market.id}-minStake`}>Aposta minima (PPC)</label>
                <input id={`${market.id}-minStake`} name="minStake" defaultValue={market.rules.minStake} />
              </div>
            </div>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <input type="checkbox" name="forceClosed" defaultChecked={Boolean(state?.forceClosed)} />
              <span className="muted">Fechar mercado manualmente</span>
            </label>

            {settled ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Liquidado como: <strong>{settled.winner}</strong> em{" "}
                {new Date(settled.settledAt).toLocaleString("pt-BR")}
              </p>
            ) : null}

            <div className="timer-banner" style={{ marginTop: 12 }}>
              <strong style={{ color: "#92400e" }}>Protecao da casa</strong>
              <span className="muted">
                Entrada maxima sem perda: lado A {protection.sideA} PPC, lado B {protection.sideB} PPC.
                Exposicao atual: {protection.worstCasePayout.toFixed(0)} PPC sobre {protection.totalStaked.toFixed(0)} PPC no livro.
              </span>
            </div>

            <div className="inline-actions">
              <button type="submit" className="btn btn-primary">
                Salvar mercado
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => settleMarket(market.id, "playerA")}>
                Liquidar lado A
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => settleMarket(market.id, "playerB")}>
                Liquidar lado B
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => settleMarket(market.id, "cancelada")}>
                Cancelar e reembolsar
              </button>
            </div>
          </form>
        );
      })}

      {markets.length > 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          Total de apostas registradas neste navegador: {betsCount}
        </p>
      ) : null}
    </div>
  );
}
