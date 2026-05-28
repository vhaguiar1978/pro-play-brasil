"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Coins,
  Flame,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "A" | "B";

type PoolSummary = {
  totalPool: number;
  sideA: { count: number; stake: number };
  sideB: { count: number; stake: number };
  oddsA: number | null;
  oddsB: number | null;
};

type Props = {
  matchId: string;
  playerAName: string;
  playerBName: string;
  /** Status atual do match — só "pending" aceita aposta. */
  matchStatus: string;
  /** Se o usuário é jogador desta partida (bloqueia totalmente o slip). */
  iAmPlayer: boolean;
  /** Se está logado (precisa pra apostar). */
  hasNickname: boolean;
};

const QUICK_STAKES = [10, 25, 50, 100, 250];
const RAKE_PERCENT = 0.10;
const MIN_STAKE = 5;
const MAX_STAKE = 2000;

export function MatchBetSlip({
  matchId,
  playerAName,
  playerBName,
  matchStatus,
  iAmPlayer,
  hasNickname
}: Props) {
  const [pool, setPool] = useState<PoolSummary | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [selectedSide, setSelectedSide] = useState<Side | null>(null);
  const [stake, setStake] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canBet = matchStatus === "pending" && !iAmPlayer;

  const refresh = useCallback(async () => {
    try {
      const [poolRes, walletRes] = await Promise.all([
        fetch(`/api/bets?matchId=${encodeURIComponent(matchId)}`),
        fetch(`/api/wallet`)
      ]);
      if (poolRes.ok) {
        const data = (await poolRes.json()) as PoolSummary;
        setPool(data);
      }
      if (walletRes.ok) {
        const data = (await walletRes.json()) as { balance: number | null };
        setBalance(data.balance);
      }
    } catch {
      // silencioso — UI já mostra "—" enquanto carrega
    }
  }, [matchId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stakeNum = Number(stake);
  const stakeValid =
    Number.isFinite(stakeNum) && stakeNum >= MIN_STAKE && stakeNum <= MAX_STAKE;
  const hasFunds = balance != null && stakeValid && stakeNum <= balance;

  // Calcula payout estimado (depois do rake) supondo que o pool atual + esta aposta liquide
  // com nick vencendo. Útil pro usuário ver "se ganhar leva ~X".
  const estimatedPayout = useMemo(() => {
    if (!pool || !selectedSide || !stakeValid) return null;
    const sideStake = selectedSide === "A" ? pool.sideA.stake : pool.sideB.stake;
    const otherStake = selectedSide === "A" ? pool.sideB.stake : pool.sideA.stake;
    const newSideTotal = sideStake + stakeNum;
    const newPool = pool.totalPool + stakeNum;
    const payable = newPool - Math.floor(newPool * RAKE_PERCENT);
    if (otherStake === 0 && sideStake === 0) {
      // só você apostou ainda — devolução parcial (menos rake)
      return Math.floor(stakeNum - stakeNum * RAKE_PERCENT);
    }
    if (otherStake === 0) {
      // ninguém no outro lado ainda — devolução parcial
      return Math.floor(stakeNum - stakeNum * RAKE_PERCENT);
    }
    return Math.floor((stakeNum / newSideTotal) * payable);
  }, [pool, selectedSide, stakeNum, stakeValid]);

  async function handleConfirm() {
    if (!selectedSide || !stakeValid) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, side: selectedSide, stake: stakeNum })
      });
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error || "Erro ao registrar aposta");
      }
      setSuccess(
        data.flagged
          ? "Aposta registrada — payout em revisão de segurança"
          : `Aposta de ${stakeNum} PPC no ${selectedSide === "A" ? playerAName : playerBName} confirmada!`
      );
      setStake("");
      setSelectedSide(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── ESTADOS DE BLOQUEIO (mostra explicação ao invés do slip) ───
  if (matchStatus === "finalized" || matchStatus === "bye") {
    return (
      <BetSlipShell title="Apostas encerradas">
        <p className="text-xs text-ppb-muted">
          Esta partida já foi finalizada — as apostas foram liquidadas automaticamente.
        </p>
        {pool && pool.totalPool > 0 ? <PoolBar pool={pool} playerAName={playerAName} playerBName={playerBName} /> : null}
      </BetSlipShell>
    );
  }
  if (matchStatus !== "pending") {
    return (
      <BetSlipShell title="Apostas fechadas">
        <p className="text-xs text-ppb-muted">
          A partida já foi reportada ou está em disputa. Apostas só rolam quando o status é &ldquo;pronta pra jogar&rdquo;.
        </p>
        {pool && pool.totalPool > 0 ? <PoolBar pool={pool} playerAName={playerAName} playerBName={playerBName} /> : null}
      </BetSlipShell>
    );
  }
  if (iAmPlayer) {
    return (
      <BetSlipShell title="Você está jogando">
        <div className="flex items-start gap-2 rounded-xl border border-ppb-border bg-ppb-subtle/40 p-3 text-xs text-ppb-muted">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>
            Jogadores da partida não podem apostar nela — regra anti-trapaça. Você consegue
            acompanhar o pool aberto abaixo.
          </span>
        </div>
        {pool && pool.totalPool > 0 ? <PoolBar pool={pool} playerAName={playerAName} playerBName={playerBName} /> : null}
      </BetSlipShell>
    );
  }

  // ─── SLIP ATIVO ───
  return (
    <BetSlipShell
      title="Aposte no confronto"
      right={
        balance != null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-text">
            <Wallet className="h-3 w-3 text-ppb-primary" />
            {balance.toLocaleString("pt-BR")} PPC
          </span>
        ) : null
      }
    >
      {!hasNickname ? (
        <div className="flex items-start gap-2 rounded-xl border border-ppb-border bg-ppb-subtle/40 p-3 text-xs text-ppb-muted">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <Link href="/perfil/editar" className="font-bold text-ppb-primary hover:underline">
              Defina seu gamertag
            </Link>{" "}
            pra liberar as apostas.
          </span>
        </div>
      ) : null}

      {/* Cards de cada lado — clica pra selecionar */}
      <div className="grid grid-cols-2 gap-3">
        <SideCard
          side="A"
          name={playerAName}
          stake={pool?.sideA.stake ?? 0}
          count={pool?.sideA.count ?? 0}
          odds={pool?.oddsA ?? null}
          selected={selectedSide === "A"}
          onSelect={() => {
            setSelectedSide("A");
            setError(null);
            setSuccess(null);
          }}
          disabled={!canBet || !hasNickname}
        />
        <SideCard
          side="B"
          name={playerBName}
          stake={pool?.sideB.stake ?? 0}
          count={pool?.sideB.count ?? 0}
          odds={pool?.oddsB ?? null}
          selected={selectedSide === "B"}
          onSelect={() => {
            setSelectedSide("B");
            setError(null);
            setSuccess(null);
          }}
          disabled={!canBet || !hasNickname}
        />
      </div>

      <PoolBar pool={pool} playerAName={playerAName} playerBName={playerBName} />

      {/* Stake + confirmar — só aparece depois que escolheu um lado */}
      {selectedSide ? (
        <div className="space-y-3 rounded-2xl border border-ppb-primary/30 bg-ppb-primary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
              Quanto vai apostar em {selectedSide === "A" ? playerAName : playerBName}?
            </span>
            <button
              type="button"
              onClick={() => setSelectedSide(null)}
              className="text-[10px] font-bold uppercase tracking-wider text-ppb-muted hover:text-ppb-text"
            >
              Trocar lado
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-primary" />
              <input
                type="number"
                inputMode="numeric"
                min={MIN_STAKE}
                max={MAX_STAKE}
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder={`${MIN_STAKE}–${MAX_STAKE} PPC`}
                className="w-full rounded-xl border border-ppb-border bg-ppb-surface py-3 pl-10 pr-3 font-display text-2xl font-black text-white focus:border-ppb-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_STAKES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStake(String(value))}
                disabled={balance != null && value > balance}
                className="rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-text transition hover:border-ppb-primary/40 hover:text-ppb-primary disabled:opacity-30"
              >
                {value} PPC
              </button>
            ))}
            {balance != null && balance >= MIN_STAKE ? (
              <button
                type="button"
                onClick={() => setStake(String(Math.min(balance, MAX_STAKE)))}
                className="ml-auto rounded-full border border-ppb-accent/40 bg-ppb-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-accent transition hover:bg-ppb-accent/20"
              >
                <Flame className="mr-1 inline h-3 w-3" />
                Tudo ({Math.min(balance, MAX_STAKE)} PPC)
              </button>
            ) : null}
          </div>

          {/* Estimativa de payout */}
          {estimatedPayout != null && estimatedPayout > 0 ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-ppb-background/60 px-3 py-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-ppb-mutedSoft">
                Se ganhar, leva ~
              </span>
              <span className="font-display text-xl font-black text-ppb-gold">
                {estimatedPayout.toLocaleString("pt-BR")} PPC
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasFunds || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {submitting
              ? "Registrando..."
              : !stakeValid
                ? `Stake entre ${MIN_STAKE} e ${MAX_STAKE} PPC`
                : !hasFunds
                  ? "Saldo insuficiente"
                  : `Apostar ${stakeNum} PPC no ${selectedSide === "A" ? playerAName : playerBName}`}
          </button>

          {balance != null && balance < MIN_STAKE ? (
            <Link
              href="/carteira/comprar"
              className="block text-center text-[11px] font-bold uppercase tracking-wider text-ppb-accent hover:underline"
            >
              <Sparkles className="mr-1 inline h-3 w-3" />
              Saldo baixo — comprar PPC
            </Link>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {success}
        </div>
      ) : null}

      <p className="text-[10px] leading-relaxed text-ppb-mutedSoft">
        Pool betting com 10% de rake. Saldo é debitado na hora; payout cai automático quando a
        partida finaliza. Apostas suspeitas entram no pool, mas o ganho fica retido até o admin
        revisar (anti-trapaça).
      </p>
    </BetSlipShell>
  );
}

// ─────────────── PIECES ───────────────

function BetSlipShell({
  title,
  right,
  children
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-display text-sm font-black uppercase tracking-wider text-ppb-text">
          <Coins className="h-4 w-4 text-ppb-primary" />
          {title}
        </h3>
        {right}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SideCard({
  side,
  name,
  stake,
  count,
  odds,
  selected,
  onSelect,
  disabled
}: {
  side: Side;
  name: string;
  stake: number;
  count: number;
  odds: number | null;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-stretch gap-2 rounded-2xl border bg-ppb-subtle/40 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-ppb-primary bg-ppb-primary/10 shadow-[0_0_24px_rgba(255,106,0,0.25)] ring-2 ring-ppb-primary/40"
          : "border-ppb-border hover:border-ppb-primary/40 hover:bg-ppb-primary/5"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-mutedSoft">
          Lado {side}
        </span>
        {odds != null ? (
          <span className="rounded-full bg-ppb-background/80 px-2 py-0.5 text-[10px] font-black text-ppb-gold ring-1 ring-ppb-gold/30">
            {odds.toFixed(2)}x
          </span>
        ) : null}
      </div>
      <span className="font-display text-base font-black uppercase leading-tight text-white">
        {name}
      </span>
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        <span>
          {count} {count === 1 ? "aposta" : "apostas"}
        </span>
        <span className="text-ppb-text">{stake.toLocaleString("pt-BR")} PPC</span>
      </div>
      {selected ? (
        <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-ppb-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
          <Check className="h-2.5 w-2.5" />
          Selecionado
        </span>
      ) : null}
    </button>
  );
}

function PoolBar({
  pool,
  playerAName,
  playerBName
}: {
  pool: PoolSummary | null;
  playerAName: string;
  playerBName: string;
}) {
  if (!pool || pool.totalPool === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ppb-border bg-ppb-subtle/40 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        Pool zerado — seja o primeiro a apostar
      </div>
    );
  }
  const pctA = pool.totalPool > 0 ? (pool.sideA.stake / pool.totalPool) * 100 : 50;
  const pctB = 100 - pctA;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        <span>Pool total</span>
        <span className="text-ppb-text">{pool.totalPool.toLocaleString("pt-BR")} PPC</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-ppb-background">
        <div className="bg-ppb-primary" style={{ width: `${pctA}%` }} />
        <div className="bg-ppb-accent" style={{ width: `${pctB}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-ppb-primary">
          {playerAName} {pctA.toFixed(0)}%
        </span>
        <span className="text-ppb-accent">
          {pctB.toFixed(0)}% {playerBName}
        </span>
      </div>
    </div>
  );
}
