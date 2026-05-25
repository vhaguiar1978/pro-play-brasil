import { Crown, Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type PodiumEntry = {
  position: 1 | 2 | 3;
  prize: string;
  hint?: string;
};

type Props = {
  entries: PodiumEntry[];
  className?: string;
};

const STYLE = {
  1: {
    icon: Crown,
    label: "1º lugar",
    border: "border-ppb-gold/40",
    bg: "bg-gradient-to-br from-ppb-gold/15 via-ppb-surface to-ppb-surface",
    chipBg: "bg-ppb-gold text-ppb-background",
    text: "text-ppb-gold",
    glow: "shadow-[0_0_24px_rgba(243,178,79,0.25)]"
  },
  2: {
    icon: Medal,
    label: "2º lugar",
    border: "border-white/20",
    bg: "bg-gradient-to-br from-white/10 via-ppb-surface to-ppb-surface",
    chipBg: "bg-white/90 text-ppb-background",
    text: "text-white",
    glow: ""
  },
  3: {
    icon: Trophy,
    label: "3º lugar",
    border: "border-amber-700/30",
    bg: "bg-gradient-to-br from-amber-700/10 via-ppb-surface to-ppb-surface",
    chipBg: "bg-amber-700/80 text-white",
    text: "text-amber-500",
    glow: ""
  }
} as const;

export function PodiumCard({ entries, className }: Props) {
  const sorted = [...entries].sort((a, b) => a.position - b.position);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {sorted.map((entry) => {
        const s = STYLE[entry.position];
        const Icon = s.icon;
        return (
          <div
            key={entry.position}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 transition-transform hover:-translate-y-0.5",
              s.border,
              s.bg,
              s.glow
            )}
          >
            <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-black", s.chipBg)}>
              {entry.position}º
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider", s.text)}>
                <Icon className="h-3 w-3" />
                {s.label}
              </div>
              <div className="mt-0.5 truncate text-base font-black text-ppb-text">{entry.prize}</div>
              {entry.hint ? (
                <div className="truncate text-xs text-ppb-muted">{entry.hint}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
