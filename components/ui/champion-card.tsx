"use client";

import Image from "next/image";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  title: string;
  image?: string;
  prize?: string;
  className?: string;
};

const GRADIENTS = [
  "from-ppb-primary/40 via-ppb-primaryDeep/60 to-ppb-background",
  "from-ppb-accent/40 via-cyan-900/60 to-ppb-background",
  "from-fuchsia-500/40 via-purple-900/60 to-ppb-background",
  "from-emerald-500/40 via-teal-900/60 to-ppb-background",
  "from-rose-500/40 via-red-900/60 to-ppb-background",
  "from-amber-400/40 via-orange-900/60 to-ppb-background"
];

function hashIdx(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function ChampionCard({ name, title, image, prize, className }: Props) {
  const [errored, setErrored] = useState(false);
  const initial = name?.[0]?.toUpperCase() ?? "?";
  const gradient = GRADIENTS[hashIdx(name + title, GRADIENTS.length)];
  const showImage = image && !errored;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-ppb-gold/40 hover:shadow-[0_0_28px_rgba(243,178,79,0.22)]",
        className
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ppb-subtle">
        {showImage ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-7xl font-black text-white/35 drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                {initial}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ppb-background via-ppb-background/40 to-transparent" />
        <div className="absolute right-3 top-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-ppb-gold/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ppb-background shadow-lg">
            <Trophy className="h-3 w-3" />
            Campeão
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-gold">
            {title}
          </div>
          <div className="mt-1 truncate font-display text-xl font-black text-white">
            {name}
          </div>
          {prize ? (
            <div className="mt-1 text-xs font-bold text-white/80">{prize}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
