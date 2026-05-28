"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Coins,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

type BetStatus =
  | "open"
  | "locked"
  | "settled_win"
  | "settled_loss"
  | "void"
  | "flagged_hold";

type Bet = {
  id: string;
  matchId: string;
  tournamentId: string;
  bettorNick: string;
  side: "A" | "B";
  stake: number;
  potentialPayout: number | null;
  status: BetStatus;
  flagged: boolean;
  createdAt: string;
  settledAt: string | null;
};

const STATUS_META: Record<
  BetStatus,
  { label: string; tone: "open" | "win" | "loss" | "void" | "hold" }
> = {
  open: { label: "Aberta", tone: "open" },
  locked: { label: "Travada", tone: "open" },
  settled_win: { label: "Ganhou", tone: "win" },
  settled_loss: { label: "Perdeu", tone: "loss" },
  void: { label: "Reembolsada", tone: "void" },
  flagged_hold: { label: "Em revisão", tone: "hold" }
};

export function MyBetsSection() {
  const [bets, setBets] = useState<Bet[] | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/bets/mine");
      if (!r.ok) {
        setBets([]);
        return;
      }
      const data = await r.json();
      setBets(data.bets ?? []);
    } catch {
      setBets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    if (!bets) return null;
    let totalStaked = 0;
    let totalReturn = 0;
    let wins = 0;
    let losses = 0;
    let open = 0;
    let hold = 0;
    for (const b of bets) {
      totalStaked += b.stake;
      if (b.status === "settled_win") {
        wins++;
        totalReturn += b.potentialPayout ?? 0;
      } else if (b.status === "settled_loss") {
        losses++;
      } else if (b.status === "void") {
        totalReturn += b.stake; // refund
      } else if (b.status === "flagged_hold") {
        hold++;
      } else {
        open++;
      }
    }
    const net = totalReturn - totalStaked;
    const roi = totalStaked > 0 ? (net / totalStaked) * 100 : 0;
    return { totalStaked, totalReturn, wins, losses, open, hold, net, roi };
  }, [bets]);

  if (bets == null) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/40 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-ppb-primary" />
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/40 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ppb-primary/10 ring-1 ring-ppb-primary/30">
          <Coins className="h-6 w-6 text-ppb-primary" />
        </div>
        <h3 className="mt-3 font-display text-base font-black uppercase tracking-wider text-ppb-text">
          Você ainda não apostou
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-ppb-muted">
          Vai num confronto em andamento, escolhe um lado, define o quanto quer apostar e
          confirma. Ganhou? PPC cai direto na carteira.
        </p>
        <Link
          href="/campeonatos"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ppb-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover"
        >
          Ver confrontos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile
            label="Apostado"
            value={`${stats.totalStaked.toLocaleString("pt-BR")}`}
            suffix="PPC"
            icon={<Coins className="h-4 w-4" />}
            tone="primary"
          />
          <KpiTile
            label="Retorno"
            value={`${stats.totalReturn.toLocaleString("pt-BR")}`}
            suffix="PPC"
            icon={<TrendingUp className="h-4 w-4" />}
            tone="accent"
          />
          <KpiTile
            label="Resultado"
            value={`${stats.net >= 0 ? "+" : ""}${stats.net.toLocaleString("pt-BR")}`}
            suffix="PPC"
            icon={stats.net >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            tone={stats.net >= 0 ? "win" : "loss"}
          />
          <KpiTile
            label="ROI"
            value={`${stats.roi >= 0 ? "+" : ""}${stats.roi.toFixed(0)}%`}
            icon={<Sparkles className="h-4 w-4" />}
            tone={stats.roi >= 0 ? "win" : "loss"}
          />
        </div>
      ) : null}

      {/* atalhos */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
        {stats && stats.hold > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-amber-300 ring-1 ring-amber-500/40">
            <ShieldAlert className="h-3 w-3" />
            {stats.hold} em revisão
          </span>
        ) : null}
        {stats && stats.open > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ppb-primary/10 px-3 py-1 text-ppb-primary ring-1 ring-ppb-primary/30">
            <Clock className="h-3 w-3" />
            {stats.open} aberta(s)
          </span>
        ) : null}
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1 text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Atualizar
        </button>
      </div>

      {/* lista */}
      <ul className="space-y-2">
        {bets.map((bet) => (
          <BetRow key={bet.id} bet={bet} />
        ))}
      </ul>
    </div>
  );
}

// ─────────────── PIECES ───────────────

function BetRow({ bet }: { bet: Bet }) {
  const meta = STATUS_META[bet.status];
  return (
    <li>
      <Link
        href={`/partidas/${encodeURIComponent(bet.matchId)}`}
        className="group flex items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-surface p-4 transition-all hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:shadow-ppb-glow"
      >
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
            bet.side === "A"
              ? "bg-ppb-primary/10 text-ppb-primary ring-ppb-primary/30"
              : "bg-ppb-accent/10 text-ppb-accent ring-ppb-accent/30"
          )}
        >
          <span className="font-display text-base font-black">{bet.side}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
            {bet.flagged && bet.status === "flagged_hold" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40">
                <ShieldAlert className="h-2.5 w-2.5" />
                Aguardando admin
              </span>
            ) : null}
            <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
              {new Date(bet.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="mt-1 truncate font-bold text-ppb-text">
            {bet.stake.toLocaleString("pt-BR")} PPC no lado {bet.side}
            {bet.potentialPayout != null && bet.status === "settled_win" ? (
              <span className="ml-2 font-display text-ppb-gold">
                → +{bet.potentialPayout.toLocaleString("pt-BR")}
              </span>
            ) : bet.status === "settled_loss" ? (
              <span className="ml-2 text-rose-300">→ −{bet.stake.toLocaleString("pt-BR")}</span>
            ) : bet.status === "void" ? (
              <span className="ml-2 text-ppb-mutedSoft">→ reembolso</span>
            ) : bet.potentialPayout != null && bet.status === "flagged_hold" ? (
              <span className="ml-2 text-amber-300">
                ~{bet.potentialPayout.toLocaleString("pt-BR")} retido
              </span>
            ) : null}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-ppb-muted transition-colors group-hover:text-ppb-primary" />
      </Link>
    </li>
  );
}

function KpiTile({
  label,
  value,
  suffix,
  icon,
  tone
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
  tone: "primary" | "accent" | "win" | "loss";
}) {
  const toneClass =
    tone === "win"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : tone === "loss"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
        : tone === "accent"
          ? "border-ppb-accent/40 bg-ppb-accent/10 text-ppb-accent"
          : "border-ppb-primary/40 bg-ppb-primary/10 text-ppb-primary";
  return (
    <div className={cn("rounded-2xl border px-3 py-3", toneClass)}>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80">
        <span>{label}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="mt-1 font-display text-xl font-black">
        {value}
        {suffix ? <span className="ml-1 text-[10px] opacity-70">{suffix}</span> : null}
      </div>
    </div>
  );
}

function StatusChip({
  tone,
  children
}: {
  tone: "open" | "win" | "loss" | "void" | "hold";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "win"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
      : tone === "loss"
        ? "bg-rose-500/15 text-rose-300 ring-rose-500/40"
        : tone === "hold"
          ? "bg-amber-500/15 text-amber-300 ring-amber-500/40"
          : tone === "void"
            ? "bg-ppb-subtle text-ppb-muted ring-ppb-border"
            : "bg-ppb-primary/10 text-ppb-primary ring-ppb-primary/30";
  const Icon =
    tone === "win" ? Check : tone === "loss" ? X : tone === "hold" ? ShieldAlert : Clock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1",
        toneClass
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {children}
    </span>
  );
}
