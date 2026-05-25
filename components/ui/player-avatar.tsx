"use client";

import { Crown, Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerAvatar } from "@/lib/use-player-avatar";

type Props = {
  nick: string;
  position?: number;
  size?: "sm" | "md" | "lg";
  /** URL da foto. Se passado, usa diretamente sem fetch. */
  imageUrl?: string | null;
  /** Se true, NÃO faz fetch da API (use quando souber que não há foto, ex: listas grandes). */
  skipFetch?: boolean;
  className?: string;
};

const SIZE = {
  sm: { box: "h-9 w-9", text: "text-xs", crown: "h-3 w-3", crownPos: "-top-1 -right-1 h-4 w-4" },
  md: { box: "h-11 w-11", text: "text-sm", crown: "h-3.5 w-3.5", crownPos: "-top-1.5 -right-1.5 h-5 w-5" },
  lg: { box: "h-14 w-14", text: "text-base", crown: "h-4 w-4", crownPos: "-top-2 -right-2 h-6 w-6" }
} as const;

const GRADIENTS = [
  "from-ppb-primary/80 to-ppb-primaryDeep",
  "from-ppb-accent/80 to-cyan-700",
  "from-fuchsia-500/80 to-purple-700",
  "from-emerald-500/80 to-teal-700",
  "from-rose-500/80 to-red-700",
  "from-amber-400/80 to-orange-700"
];

function hashIdx(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function PlayerAvatar({ nick, position, size = "md", imageUrl, skipFetch, className }: Props) {
  // Se imageUrl foi passado, usa direto. Senão, busca via hook.
  const fetched = usePlayerAvatar(skipFetch || imageUrl !== undefined ? null : nick);
  const finalUrl = imageUrl ?? fetched;

  const initial = nick.replace(/[^a-zA-Z0-9]/g, "")[0]?.toUpperCase() ?? "?";
  const s = SIZE[size];
  const gradient = GRADIENTS[hashIdx(nick, GRADIENTS.length)];
  const isTop3 = position && position >= 1 && position <= 3;

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg",
          s.box
        )}
      >
        {finalUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={finalUrl}
            alt={nick}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className={cn(
              "grid h-full w-full place-items-center bg-gradient-to-br font-display font-black uppercase text-white",
              s.text,
              gradient
            )}
          >
            {initial}
          </div>
        )}
      </div>
      {isTop3 ? (
        <span
          className={cn(
            "absolute grid place-items-center rounded-full ring-2 ring-ppb-background",
            s.crownPos,
            position === 1 && "bg-ppb-gold text-ppb-background",
            position === 2 && "bg-white text-ppb-background",
            position === 3 && "bg-amber-700 text-white"
          )}
        >
          {position === 1 ? (
            <Crown className={s.crown} />
          ) : position === 2 ? (
            <Medal className={s.crown} />
          ) : (
            <Trophy className={s.crown} />
          )}
        </span>
      ) : null}
    </div>
  );
}
