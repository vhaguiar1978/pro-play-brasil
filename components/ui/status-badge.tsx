import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "open" | "live" | "finished" | "neutral" | "soon";

const TONE: Record<StatusTone, { dot: string; ring: string; text: string; bg: string; label: string }> = {
  open: {
    dot: "bg-ppb-primary",
    ring: "ring-ppb-primary/40",
    text: "text-ppb-primary",
    bg: "bg-ppb-primarySoft",
    label: "Inscrições abertas"
  },
  live: {
    dot: "bg-emerald-400 animate-pulse",
    ring: "ring-emerald-400/40",
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    label: "Ao vivo"
  },
  finished: {
    dot: "bg-white/60",
    ring: "ring-white/20",
    text: "text-white/70",
    bg: "bg-white/5",
    label: "Encerrado"
  },
  soon: {
    dot: "bg-ppb-accent",
    ring: "ring-ppb-accent/40",
    text: "text-ppb-accent",
    bg: "bg-ppb-accentSoft",
    label: "Em breve"
  },
  neutral: {
    dot: "bg-white/50",
    ring: "ring-white/15",
    text: "text-white/80",
    bg: "bg-white/5",
    label: ""
  }
};

type Props = {
  tone: StatusTone;
  children?: ReactNode;
  size?: "sm" | "md";
  className?: string;
};

export function StatusBadge({ tone, children, size = "md", className }: Props) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-bold uppercase tracking-wider ring-1 backdrop-blur",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        t.ring,
        t.text,
        t.bg,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]", t.dot)} />
      {children ?? t.label}
    </span>
  );
}
