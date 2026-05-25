"use client";

import { Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ChampionBadge } from "@/components/ui/champion-badge";
import { computeGroupStandings, type StandingsMatch } from "@/lib/group-standings";

type Props = {
  matches: StandingsMatch[];
  /** Quantos jogadores avançam pra próxima fase (destaque visual). Padrão 2. */
  qualifiers?: number;
  className?: string;
};

export function GroupStandings({ matches, qualifiers = 2, className }: Props) {
  const groups = computeGroupStandings(matches);
  if (groups.length === 0) return null;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/30">
          <Users className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-accent">
            Classificação
          </div>
          <div className="font-display text-lg font-black text-ppb-text">
            Top {qualifiers} de cada grupo avança
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <div
            key={g.round}
            className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-ppb-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ppb-primary ring-1 ring-ppb-primary/30">
                {g.groupLabel}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                {g.rows.length} jogadores
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ppb-border text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    <th className="py-2 pl-1 text-left">#</th>
                    <th className="py-2 text-left">Jogador</th>
                    <th className="py-2 text-center" title="Jogos">J</th>
                    <th className="py-2 text-center" title="Vitórias">V</th>
                    <th className="py-2 text-center" title="Derrotas">D</th>
                    <th className="py-2 text-center" title="Saldo de gols">SG</th>
                    <th className="py-2 pr-1 text-right" title="Pontos">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((row, idx) => {
                    const qualifies = idx < qualifiers;
                    return (
                      <tr
                        key={row.nickname}
                        className={cn(
                          "border-b border-ppb-border/40 transition",
                          qualifies && "bg-emerald-500/5"
                        )}
                      >
                        <td className="py-2.5 pl-1">
                          <span
                            className={cn(
                              "grid h-6 w-6 place-items-center rounded-full font-mono text-[10px] font-black",
                              qualifies
                                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                                : "bg-ppb-background/60 text-ppb-mutedSoft ring-1 ring-ppb-border"
                            )}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <PlayerAvatar nick={row.nickname} size="sm" />
                            <span className="truncate text-sm font-bold text-ppb-text">
                              {row.nickname}
                            </span>
                            <ChampionBadge nick={row.nickname} size="sm" />
                            {qualifies ? (
                              <Trophy className="h-3 w-3 text-emerald-400" />
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-mono text-xs text-ppb-mutedSoft">
                          {row.played}
                        </td>
                        <td className="py-2.5 text-center font-mono text-xs text-emerald-300">
                          {row.wins}
                        </td>
                        <td className="py-2.5 text-center font-mono text-xs text-rose-300">
                          {row.losses}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 text-center font-mono text-xs",
                            row.goalDiff > 0
                              ? "text-emerald-300"
                              : row.goalDiff < 0
                                ? "text-rose-300"
                                : "text-ppb-mutedSoft"
                          )}
                        >
                          {row.goalDiff > 0 ? "+" : ""}
                          {row.goalDiff}
                        </td>
                        <td className="py-2.5 pr-1 text-right font-display text-base font-black text-ppb-text">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
