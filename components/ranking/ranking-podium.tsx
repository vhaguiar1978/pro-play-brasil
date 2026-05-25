import { Crown, Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ChampionBadge } from "@/components/ui/champion-badge";

type PodiumEntry = {
  pos: number;
  nick: string;
  pts: number;
  wins: number;
  city: string;
  uf: string;
};

type Props = {
  entries: PodiumEntry[];
  className?: string;
};

const STYLES = {
  1: {
    Icon: Crown,
    ring: "ring-ppb-gold/50",
    bg: "from-ppb-gold/25 via-ppb-surface to-ppb-surface",
    glow: "shadow-[0_0_48px_rgba(243,178,79,0.35)]",
    chip: "bg-ppb-gold text-ppb-background",
    accent: "text-ppb-gold",
    label: "Campeão"
  },
  2: {
    Icon: Medal,
    ring: "ring-white/30",
    bg: "from-white/15 via-ppb-surface to-ppb-surface",
    glow: "shadow-[0_0_36px_rgba(255,255,255,0.18)]",
    chip: "bg-white text-ppb-background",
    accent: "text-white",
    label: "Vice"
  },
  3: {
    Icon: Trophy,
    ring: "ring-amber-700/40",
    bg: "from-amber-700/15 via-ppb-surface to-ppb-surface",
    glow: "shadow-[0_0_28px_rgba(180,83,9,0.30)]",
    chip: "bg-amber-700 text-white",
    accent: "text-amber-500",
    label: "3º colocado"
  }
} as const;

export function RankingPodium({ entries, className }: Props) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  // Ordem visual: 2º, 1º, 3º (com 1º elevado)
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className={cn("grid gap-4 md:grid-cols-3 md:items-end", className)}>
      {order.map((entry) => {
        const style = STYLES[entry.pos as 1 | 2 | 3];
        const Icon = style.Icon;
        const isFirst = entry.pos === 1;
        return (
          <div
            key={entry.pos}
            className={cn(
              "relative overflow-hidden rounded-3xl border border-ppb-border bg-gradient-to-br p-5 ring-1",
              style.bg,
              style.ring,
              style.glow,
              isFirst && "md:scale-105"
            )}
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-current opacity-10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                    style.chip
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {style.label}
                </span>
                <span className={cn("font-display text-4xl font-black", style.accent)}>
                  #{entry.pos}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <PlayerAvatar nick={entry.nick} position={entry.pos as 1 | 2 | 3} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-2xl font-black uppercase text-ppb-text">
                      {entry.nick}
                    </span>
                    <ChampionBadge nick={entry.nick} size="md" />
                  </div>
                  <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    {entry.city !== "–" ? `${entry.city} · ${entry.uf}` : "Brasil"}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-ppb-border bg-ppb-background/40 px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">Pontos</div>
                  <div className={cn("font-display text-xl font-black", style.accent)}>
                    {entry.pts.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="rounded-xl border border-ppb-border bg-ppb-background/40 px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">Vitórias</div>
                  <div className="font-display text-xl font-black text-ppb-text">{entry.wins}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
