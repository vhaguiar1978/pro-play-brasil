"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BetSlipModal } from "@/components/bet-slip-modal";
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
import { ensureWalletSeeded, readBets, readBettingMarkets, writeBets } from "@/lib/betting-storage";
import { appendPpcLedgerEntry } from "@/lib/ppc-ledger";
import { readArenaProfile, type ArenaProfileIdentity } from "@/lib/profile-storage";
import { readWallet, writeWallet, type Wallet } from "@/lib/wallet-storage";

function getCooldownRemaining(market: BettingMarket, userNick: string, bets: BetTicket[]) {
  const latest = bets
    .filter((bet) => bet.marketId === market.id && bet.userNick === userNick)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!latest) return 0;

  const elapsed = Date.now() - new Date(latest.createdAt).getTime();
  const cooldownMs = market.rules.cooldownMinutes * 60 * 1000;
  return Math.max(0, cooldownMs - elapsed);
}

export function BettingHub() {
  const [wallet, setWallet] = useState<Wallet>(ensureWalletSeeded());
  const [profile, setProfile] = useState<ArenaProfileIdentity | null>(null);
  const [bets, setBets] = useState<BetTicket[]>([]);
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);
  const [selectedSide, setSelectedSide] = useState<BetSelection>("playerA");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    refreshState();
  }, []);

  const openMarkets = useMemo(() => markets.filter((market) => market.status !== "fechado"), [markets]);
  const myNick = profile?.gamertag.trim() ?? "";
  const myBets = useMemo(
    () =>
      bets
        .filter((bet) => (myNick ? bet.userNick === myNick : false))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bets, myNick]
  );

  function refreshState(nextFlash?: string | null) {
    setWallet(readWallet());
    setProfile(readArenaProfile());
    setBets(readBets());
    setMarkets(readBettingMarkets());
    if (typeof nextFlash !== "undefined") setFlash(nextFlash);
  }

  function openBetSlip(market: BettingMarket, selection: BetSelection) {
    setSelectedMarket(market);
    setSelectedSide(selection);
    setFlash(null);
  }

  function confirmBet({
    market,
    selection,
    stake
  }: {
    market: BettingMarket;
    selection: BetSelection;
    stake: number;
  }) {
    const liveWallet = readWallet();
    const liveProfile = readArenaProfile();
    const liveBets = readBets();
    const liveMarkets = readBettingMarkets();
    const activeMarket = liveMarkets.find((item) => item.id === market.id);
    const userNick = liveProfile?.gamertag.trim() ?? "";

    if (!activeMarket) {
      return { ok: false, message: "Mercado nao encontrado." };
    }

    if (!userNick) {
      return { ok: false, message: "Crie seu cadastro com gamertag antes de apostar." };
    }

    if (activeMarket.status === "fechado") {
      return { ok: false, message: "Este mercado ja foi fechado para novas apostas." };
    }

    const participantBlock = getParticipantBlockReason(activeMarket, userNick);
    if (participantBlock) {
      return { ok: false, message: participantBlock };
    }

    const cooldownRemaining = getCooldownRemaining(activeMarket, userNick, liveBets);
    if (cooldownRemaining > 0) {
      return {
        ok: false,
        message: `Aguarde ${Math.ceil(cooldownRemaining / 1000)}s antes de apostar de novo neste mercado.`
      };
    }

    if (!Number.isFinite(stake) || stake < activeMarket.rules.minStake) {
      return { ok: false, message: `A aposta minima e ${activeMarket.rules.minStake} PPC.` };
    }

    if (stake > liveWallet.balance) {
      return { ok: false, message: "Seu saldo em PPC nao e suficiente." };
    }

    const maxStake = getStakeCap(activeMarket, selection, liveWallet.balance, liveBets);
    if (maxStake <= 0) {
      return { ok: false, message: "Este lado foi travado pelo controle interno de risco da casa." };
    }

    if (stake > maxStake) {
      return { ok: false, message: `Neste momento o maximo permitido para esse lado e ${maxStake} PPC.` };
    }

    const odd = activeMarket.odds[selection];
    const ticket: BetTicket = {
      id: `bet-${Date.now()}`,
      marketId: activeMarket.id,
      matchId: activeMarket.matchId,
      tournamentId: activeMarket.tournamentId,
      gameSlug: activeMarket.gameSlug,
      userNick,
      createdAt: new Date().toISOString(),
      selection,
      selectionLabel: getSelectionLabel(activeMarket, selection),
      stake,
      odds: odd,
      potentialReturn: Number((stake * odd).toFixed(2)),
      status: "aberta"
    };

    const nextWallet = {
      balance: liveWallet.balance - stake,
      updatedAt: new Date().toISOString()
    };
    const nextBets = [ticket, ...liveBets];

    writeWallet(nextWallet);
    writeBets(nextBets);
    appendPpcLedgerEntry({
      type: "bet_stake",
      amount: stake,
      direction: "out",
      source: activeMarket.id,
      note: `Aposta em ${ticket.selectionLabel}`
    });
    refreshState(
      `Aposta confirmada em ${ticket.selectionLabel}: ${ticket.stake} PPC com retorno potencial de ${ticket.potentialReturn.toFixed(0)} PPC.`
    );

    return { ok: true };
  }

  return (
    <div className="page">
      <section className="page-hero">
        <span className="badge official">Apostas em PPC</span>
        <h1>Aposte nos campeonatos em andamento</h1>
        <p className="muted">
          Mercado interno em PPC para partidas ao vivo ou prestes a comecar. O sistema bloqueia
          aposta de participante, limita exposicao da casa e segura o valor maximo liberado por lado.
        </p>
        <div className="inline-actions">
          <Link href="/arena/moedas" className="btn btn-primary">
            Comprar PPC
          </Link>
          <Link href="/campeonatos" className="btn btn-secondary">
            Ver campeonatos
          </Link>
        </div>
      </section>

      <div className="grid cols-3">
        <div className="card soft">
          <div className="kpi">
            <strong>{wallet.balance} PPC</strong>
            <span>Saldo disponivel para apostar</span>
          </div>
        </div>
        <div className="card soft">
          <div className="kpi">
            <strong>{myNick || "Sem cadastro"}</strong>
            <span>Nickname usado para validar bloqueio de participante</span>
          </div>
        </div>
        <div className="card soft">
          <div className="kpi">
            <strong>{openMarkets.length} mercados</strong>
            <span>Partidas abertas agora para aposta em PPC</span>
          </div>
        </div>
      </div>

      {flash ? (
        <div className="timer-banner" style={{ marginTop: 20 }}>
          <strong style={{ color: "#047857" }}>Atualizacao</strong>
          <span className="muted">{flash}</span>
        </div>
      ) : null}

      {!myNick ? (
        <div className="timer-banner" style={{ marginTop: 20, borderColor: "rgba(255, 213, 79, 0.25)" }}>
          <strong style={{ color: "#92400e" }}>Cadastro necessario</strong>
          <span className="muted">
            Voce pode ver os mercados agora, mas para apostar precisamos do seu gamertag salvo em{" "}
            <Link href="/cadastro">Cadastro</Link>.
          </span>
        </div>
      ) : null}

      <div className="grid cols-2" style={{ marginTop: 20 }}>
        <div className="stack">
          {openMarkets.map((market) => {
            const totals = calculateBookTotals(market, bets);
            const participantBlock = myNick ? getParticipantBlockReason(market, myNick) : null;
            const capA = getStakeCap(market, "playerA", wallet.balance, bets);
            const capB = getStakeCap(market, "playerB", wallet.balance, bets);

            return (
              <section key={market.id} className="card soft betting-market-card">
                <div className="section-head">
                  <div>
                    <span className={`badge ${market.status === "ao_vivo" ? "official" : "community"}`}>
                      {market.status === "ao_vivo" ? "Ao vivo" : "Abre em breve"}
                    </span>
                    <h2 style={{ margin: "14px 0 6px" }}>{market.tournamentName}</h2>
                    <p className="muted" style={{ margin: 0 }}>
                      {market.gameName} · {market.roundLabel} ·{" "}
                      {new Date(market.scheduledAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Link href={`/campeonatos/${market.tournamentId}`} className="btn btn-ghost">
                    Ver campeonato
                  </Link>
                </div>

                <div className="betting-versus">
                  <div className="betting-player">
                    <strong>{market.playerA}</strong>
                    <span>{formatOdd(market.odds.playerA)}</span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => openBetSlip(market, "playerA")}
                      disabled={capA <= 0 || Boolean(participantBlock)}
                    >
                      Apostar neste lado
                    </button>
                  </div>
                  <div className="betting-versus-mark">vs</div>
                  <div className="betting-player">
                    <strong>{market.playerB}</strong>
                    <span>{formatOdd(market.odds.playerB)}</span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => openBetSlip(market, "playerB")}
                      disabled={capB <= 0 || Boolean(participantBlock)}
                    >
                      Apostar neste lado
                    </button>
                  </div>
                </div>

                <div className="betting-metrics">
                  <div className="kpi">
                    <strong>{Math.round(totals.totalStaked)} PPC</strong>
                    <span>Volume atual do mercado</span>
                  </div>
                  <div className="kpi">
                    <strong>{Math.round(totals.worstCasePayout)} PPC</strong>
                    <span>Pior payout atual</span>
                  </div>
                  <div className="kpi">
                    <strong>{market.house.maxPayout} PPC</strong>
                    <span>Teto interno da casa</span>
                  </div>
                </div>

                <div className="grid cols-2" style={{ marginTop: 16 }}>
                  <div className="card soft" style={{ padding: 14 }}>
                    <strong>{market.playerA}</strong>
                    <p className="muted" style={{ margin: "8px 0 0" }}>
                      Maximo liberado agora: <strong>{capA} PPC</strong>
                    </p>
                  </div>
                  <div className="card soft" style={{ padding: 14 }}>
                    <strong>{market.playerB}</strong>
                    <p className="muted" style={{ margin: "8px 0 0" }}>
                      Maximo liberado agora: <strong>{capB} PPC</strong>
                    </p>
                  </div>
                </div>

                {participantBlock ? (
                  <div
                    className="timer-banner"
                    style={{ marginTop: 16, borderColor: "rgba(255, 89, 94, 0.25)" }}
                  >
                    <strong style={{ color: "#be123c" }}>Bloqueado para voce</strong>
                    <span className="muted">{participantBlock}</span>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <aside className="stack">
          <div className="card soft">
            <h2 style={{ marginTop: 0 }}>Criterios internos da casa</h2>
            <div className="stack">
              <div className="list-row">
                <div>
                  <strong>Limite por saldo</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Cada aposta usa no maximo 15% do saldo do usuario.
                  </div>
                </div>
              </div>
              <div className="list-row">
                <div>
                  <strong>Limite por lado</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    O mercado trava o lado que ficar concentrado demais.
                  </div>
                </div>
              </div>
              <div className="list-row">
                <div>
                  <strong>Teto de payout</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Se o pior cenario bater o teto da casa, novas apostas sao recusadas.
                  </div>
                </div>
              </div>
              <div className="list-row">
                <div>
                  <strong>Integridade competitiva</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Participante do jogo ou do campeonato inteiro nao consegue apostar.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card soft">
            <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
              <h2 style={{ margin: 0 }}>Minhas apostas</h2>
              <Link href="/arena/moedas" className="btn btn-ghost">
                Carteira PPC
              </Link>
            </div>

            {myBets.length === 0 ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Nenhuma aposta registrada ainda neste navegador.
              </p>
            ) : (
              <div className="stack" style={{ marginTop: 12 }}>
                {myBets.map((bet) => (
                  <div key={bet.id} className="list-row">
                    <div>
                      <strong>{bet.selectionLabel}</strong>
                      <div className="muted" style={{ fontSize: "0.9rem" }}>
                        {bet.stake} PPC ·{" "}
                        {bet.status === "aberta"
                          ? `retorno potencial ${bet.potentialReturn.toFixed(0)} PPC`
                          : `status ${bet.status} · payout ${bet.payout?.toFixed(0) ?? 0} PPC`}
                      </div>
                    </div>
                    <span className={`badge ${bet.status === "ganhou" ? "official" : "community"}`}>
                      {bet.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <BetSlipModal
        open={Boolean(selectedMarket)}
        market={selectedMarket}
        initialSelection={selectedSide}
        walletBalance={wallet.balance}
        gamertag={myNick}
        bets={bets}
        onClose={() => setSelectedMarket(null)}
        onConfirm={confirmBet}
      />
    </div>
  );
}
