import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  tone?: "primary" | "gold" | "accent";
};

type Props = {
  achievement: Achievement;
  className?: string;
};

const TONE = {
  primary: {
    iconBg: "bg-ppb-primary/15 text-ppb-primary ring-ppb-primary/40",
    border: "border-ppb-primary/30",
    glow: "shadow-ppb-glow",
    label: "text-ppb-primary"
  },
  gold: {
    iconBg: "bg-ppb-gold/15 text-ppb-gold ring-ppb-gold/40",
    border: "border-ppb-gold/30",
    glow: "shadow-[0_0_24px_rgba(243,178,79,0.25)]",
    label: "text-ppb-gold"
  },
  accent: {
    iconBg: "bg-ppb-accent/15 text-ppb-accent ring-ppb-accent/40",
    border: "border-ppb-accent/30",
    glow: "shadow-ppb-glow-cyan",
    label: "text-ppb-accent"
  }
} as const;

export function AchievementBadge({ achievement, className }: Props) {
  const t = TONE[achievement.tone ?? "primary"];
  const Icon = achievement.icon;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-ppb-surface p-4 transition-all duration-300",
        achievement.unlocked
          ? cn(t.border, t.glow, "hover:-translate-y-0.5")
          : "border-ppb-border opacity-50 grayscale",
        className
      )}
    >
      {achievement.unlocked ? (
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-10 blur-2xl" />
      ) : null}
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1",
            achievement.unlocked ? t.iconBg : "bg-ppb-subtle text-ppb-mutedSoft ring-ppb-border"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              achievement.unlocked ? t.label : "text-ppb-mutedSoft"
            )}
          >
            {achievement.unlocked ? "Conquistada" : "Bloqueada"}
          </div>
          <div className="mt-0.5 font-display text-sm font-black uppercase text-ppb-text">
            {achievement.title}
          </div>
          <div className="mt-1 text-xs leading-snug text-ppb-muted">{achievement.description}</div>
        </div>
      </div>
    </div>
  );
}
