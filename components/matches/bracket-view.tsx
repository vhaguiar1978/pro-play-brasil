"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ChampionBadge } from "@/components/ui/champion-badge";
import { GroupStandings } from "@/components/matches/group-standings";

type MatchPlayer = { nickname: string; teamName?: string };

type MatchStatus = "tbd" | "pending" | "result_submitted" | "disputed" | "finalized" | "bye";

type Match = {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  roundLabel: string;
  playerA: MatchPlayer | null;
  playerB: MatchPlayer | null;
  status: MatchStatus;
  scoreA: number | null;
  scoreB: number | null;
  winner: "A" | "B" | null;
};

type Props = {
  tournamentId: string;
  className?: string;
  /** Auto-refresh em ms. Default 30s. */
  refreshIntervalMs?: number;
};

export function BracketView({ tournamentId, className, refreshIntervalMs = 30_000 }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/tournaments/${tournamentId}/matches`);
      const data = await r.json();
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchMatches();
    if (refreshIntervalMs > 0) {
      const id = setInterval(fetchMatches, refreshIntervalMs);
      return () => clearInterval(id);
    }
  }, [fetchMatches, refreshIntervalMs]);

  // Agrupa matches por rodada
  const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  if (loading && matches.length === 0) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-12">
        <RefreshCw className="h-6 w-6 animate-spin text-ppb-primary" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-10 text-center">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ppb-primary/10 blur-3xl" />
        <div className="relative">
          <Trophy className="mx-auto h-10 w-10 text-ppb-mutedSoft" />
          <h3 className="mt-4 font-display text-xl font-black uppercase text-ppb-text">
            Chaveamento ainda não foi gerado
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ppb-muted">
            O bracket aparece aqui quando o admin clica em <strong>Iniciar campeonato</strong> no painel.
          </p>
        </div>
      </div>
    );
  }

  // Acha o campeão (winner do último round). Ignora se for fase de grupos —
  // grupos não têm "campeão da rodada", só classificação.
  const finalRound = Math.max(...roundNumbers);
  const finalMatch = rounds[finalRound]?.[0];
  const finalIsGroup = finalMatch ? /^Grupo\s/.test(finalMatch.roundLabel) : false;
  const champion =
    !finalIsGroup && finalMatch?.status === "finalized" && finalMatch.winner
      ? finalMatch.winner === "A"
        ? finalMatch.playerA
        : finalMatch.playerB
      : null;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
          <LegendDot color="bg-emerald-400" label="Pronta" />
          <LegendDot color="bg-amber-400" label="Aguardando confirmação" />
          <LegendDot color="bg-rose-400" label="Em disputa" />
          <LegendDot color="bg-ppb-gold" label="Finalizada" />
          <LegendDot color="bg-white/30" label="A definir" />
        </div>
        <button
          type="button"
          onClick={fetchMatches}
          className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* STANDINGS DE GRUPOS (quando aplicável) */}
      {matches.some((m) => /^Grupo\s/.test(m.roundLabel)) ? (
        <GroupStandings matches={matches} />
      ) : null}

      {/* CAMPEÃO (quando definido) */}
      {champion ? (
        <div className="relative overflow-hidden rounded-3xl border border-ppb-gold/40 bg-gradient-to-br from-ppb-gold/15 via-ppb-surface to-ppb-surface p-6 shadow-[0_0_48px_rgba(243,178,79,0.25)]">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-ppb-gold/30 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <Crown className="h-10 w-10 text-ppb-gold drop-shadow-[0_0_12px_currentColor]" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                Campeão
              </div>
              <div className="font-display text-3xl font-black uppercase text-white md:text-4xl">
                {champion.teamName || champion.nickname}
              </div>
              {champion.teamName ? (
                <div className="text-xs text-ppb-muted">{champion.nickname}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* BRACKET — colunas horizontais */}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-full gap-6">
          {roundNumbers.map((round) => (
            <div key={round} className="flex w-72 shrink-0 flex-col gap-3">
              <h3 className="font-display text-xs font-black uppercase tracking-wider text-ppb-mutedSoft">
                {rounds[round][0]?.roundLabel ?? `Rodada ${round}`}
              </h3>
              <div
                className="flex flex-1 flex-col justify-around gap-3"
                style={{
                  // Vertical centering proporcional pra dar visual de bracket conectado
                  paddingTop: `${(2 ** (round - 1) - 1) * 20}px`
                }}
              >
                {rounds[round].map((m) => (
                  <MatchTile key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchTile({ match }: { match: Match }) {
  const isFinalized = match.status === "finalized" || match.status === "bye";
  const isPending = match.status === "pending";
  const isWaiting = match.status === "result_submitted";
  const isDisputed = match.status === "disputed";
  const isTbd = match.status === "tbd";

  const statusInfo = {
    pending: { Icon: Sparkles, label: "Pronta pra jogar", color: "text-emerald-300", bg: "bg-emerald-500/10 ring-emerald-500/30" },
    result_submitted: { Icon: Clock, label: "Aguardando confirmação", color: "text-amber-300", bg: "bg-amber-500/10 ring-amber-500/30" },
    disputed: { Icon: ShieldAlert, label: "Em disputa", color: "text-rose-300", bg: "bg-rose-500/10 ring-rose-500/30" },
    finalized: { Icon: CheckCircle2, label: "Finalizada", color: "text-ppb-gold", bg: "bg-ppb-gold/10 ring-ppb-gold/30" },
    bye: { Icon: CheckCircle2, label: "BYE", color: "text-ppb-muted", bg: "bg-white/5 ring-white/15" },
    tbd: { Icon: Lock, label: "A definir", color: "text-ppb-mutedSoft", bg: "bg-white/5 ring-white/10" }
  }[match.status];
  const Icon = statusInfo.Icon;

  const containerCls = cn(
    "relative overflow-hidden rounded-2xl border bg-ppb-surface transition-all duration-200",
    isFinalized && "border-ppb-gold/30",
    isPending && "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    isWaiting && "border-amber-500/40",
    isDisputed && "border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    isTbd && "border-ppb-border opacity-70"
  );

  return (
    <Link
      href={isTbd || match.status === "bye" ? "#" : `/partidas/${match.id}`}
      className={cn(containerCls, !isTbd && match.status !== "bye" && "hover:-translate-y-0.5 hover:border-ppb-borderStrong")}
    >
      {/* Status header */}
      <div
        className={cn(
          "flex items-center gap-1.5 border-b border-ppb-border px-3 py-1.5 ring-1 ring-inset",
          statusInfo.bg
        )}
      >
        <Icon className={cn("h-3 w-3", statusInfo.color)} />
        <span className={cn("text-[9px] font-bold uppercase tracking-wider", statusInfo.color)}>
          {statusInfo.label}
        </span>
      </div>

      {/* Player A */}
      <PlayerRow
        player={match.playerA}
        score={match.scoreA}
        isWinner={match.winner === "A"}
        isFinalized={isFinalized}
      />

      <div className="border-b border-ppb-border" />

      {/* Player B */}
      <PlayerRow
        player={match.playerB}
        score={match.scoreB}
        isWinner={match.winner === "B"}
        isFinalized={isFinalized}
      />
    </Link>
  );
}

function PlayerRow({
  player,
  score,
  isWinner,
  isFinalized
}: {
  player: MatchPlayer | null;
  score: number | null;
  isWinner: boolean;
  isFinalized: boolean;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ppb-subtle text-ppb-mutedSoft ring-1 ring-ppb-border">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <span className="flex-1 text-sm font-bold text-ppb-mutedSoft">A definir</span>
        <span className="font-display text-base font-black text-ppb-mutedSoft">—</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-colors",
        isFinalized && isWinner && "bg-ppb-gold/10"
      )}
    >
      <PlayerAvatar nick={player.nickname} size="sm" />
      <ChampionBadge nick={player.nickname} size="xs" />
      <span
        className={cn(
          "flex-1 truncate text-sm font-bold",
          isWinner && isFinalized ? "text-ppb-gold" : "text-ppb-text"
        )}
      >
        {player.teamName || player.nickname}
      </span>
      {isWinner && isFinalized ? <Crown className="h-3.5 w-3.5 shrink-0 text-ppb-gold" /> : null}
      <span
        className={cn(
          "font-display text-base font-black",
          isFinalized
            ? isWinner
              ? "text-ppb-gold"
              : "text-ppb-muted"
            : "text-ppb-mutedSoft"
        )}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ppb-surface/60 px-2 py-1 text-ppb-mutedSoft ring-1 ring-ppb-border">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      {label}
    </span>
  );
}
