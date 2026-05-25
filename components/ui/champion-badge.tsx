"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerBadgeLogo } from "@/lib/use-player-badge";

type Props = {
  /** Nick — busca o logo via hook automaticamente. */
  nick: string;
  /** Se passado, usa direto sem fetch. */
  logoUrl?: string | null;
  /** Tamanho. Padrão md. */
  size?: "xs" | "sm" | "md" | "lg";
  /** Mostra fallback (coroa dourada) quando o player tem selo mas sem logo. Default false. */
  showFallback?: boolean;
  className?: string;
};

const SIZE = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8"
} as const;

export function ChampionBadge({ nick, logoUrl, size = "md", showFallback, className }: Props) {
  const fetched = usePlayerBadgeLogo(logoUrl === undefined ? nick : null);
  const finalUrl = logoUrl !== undefined ? logoUrl : fetched;

  if (!finalUrl && !showFallback) return null;

  const baseCls = cn(
    "shrink-0 overflow-hidden rounded-md ring-1 ring-ppb-gold/60 bg-ppb-gold/10",
    SIZE[size],
    className
  );

  if (!finalUrl) {
    // Fallback: coroa dourada
    return (
      <span
        className={cn(
          baseCls,
          "grid place-items-center bg-ppb-gold/20 text-ppb-gold"
        )}
        title="Campeão"
      >
        <Crown className={cn(size === "xs" ? "h-2.5 w-2.5" : size === "sm" ? "h-3 w-3" : size === "md" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </span>
    );
  }

  return (
    <span className={baseCls} title="Logo do campeão">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={finalUrl} alt="" className="h-full w-full object-cover" />
    </span>
  );
}
