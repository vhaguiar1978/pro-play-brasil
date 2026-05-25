import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  highlight?: boolean;
  tone?: "primary" | "accent" | "gold";
  className?: string;
};

const TONE = {
  primary: {
    halo: "bg-ppb-primary/35",
    iconBg: "bg-ppb-subtle text-ppb-primary ring-ppb-border",
    border: "hover:border-ppb-primary/40"
  },
  accent: {
    halo: "bg-ppb-accent/35",
    iconBg: "bg-ppb-subtle text-ppb-accent ring-ppb-border",
    border: "hover:border-ppb-accent/40"
  },
  gold: {
    halo: "bg-ppb-gold/35",
    iconBg: "bg-ppb-subtle text-ppb-gold ring-ppb-border",
    border: "hover:border-ppb-gold/40"
  }
} as const;

export function IconInfoCard({ icon, label, value, hint, highlight, tone = "primary", className }: Props) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5",
        highlight
          ? "border-ppb-primary/50 bg-gradient-to-br from-ppb-primary/20 via-ppb-surface to-ppb-surface shadow-ppb-glow"
          : cn("border-ppb-border bg-ppb-surface/70 backdrop-blur", t.border),
        className
      )}
    >
      {/* Grid pattern fundo */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "16px 16px"
        }}
      />
      {/* Halo neon */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 -z-10 h-24 w-24 rounded-full blur-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-90",
          highlight ? "bg-ppb-primary/50" : t.halo
        )}
      />
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110",
            highlight
              ? "bg-ppb-primary text-white ring-ppb-primary/60 shadow-[0_0_24px_rgba(255,106,0,0.55)]"
              : t.iconBg
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft">
            {label}
          </div>
          <div className="mt-1 truncate font-display text-lg font-black leading-tight text-ppb-text">
            {value}
          </div>
          {hint ? <div className="mt-0.5 truncate text-xs text-ppb-muted">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}
