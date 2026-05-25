"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Gamepad2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

type Props = {
  name: string;
  slug: string;
  image: string;
  shortDescription?: string;
  status?: "active" | "soon";
  tournamentCount?: number;
  className?: string;
};

export function GameCard({ name, slug, image, shortDescription, status = "active", tournamentCount, className }: Props) {
  const [errored, setErrored] = useState(false);

  return (
    <Link
      href={`/jogos/${slug}`}
      className={cn(
        "group relative isolate block overflow-hidden rounded-2xl border border-ppb-border bg-ppb-subtle shadow-ppb-card transition-all duration-300 hover:-translate-y-1 hover:border-ppb-primary/50 hover:shadow-ppb-glow-strong",
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {!errored ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ppb-primary/40 via-ppb-primaryDeep/30 to-ppb-background">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <ImageOff className="h-10 w-10 text-white/30" />
            </div>
          </div>
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-ppb-background via-ppb-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tr from-ppb-primary/0 via-transparent to-ppb-accent/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-ppb-primary/30 group-hover:to-ppb-accent/20" />
        {/* Top badge */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <StatusBadge tone={status === "active" ? "open" : "soon"} size="sm">
            {status === "active" ? "Ativo" : "Em breve"}
          </StatusBadge>
          {typeof tournamentCount === "number" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-ppb-border bg-ppb-background/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
              <Gamepad2 className="h-3 w-3 text-ppb-primary" />
              {tournamentCount}
            </span>
          ) : null}
        </div>
        {/* Bottom content */}
        <div className="absolute inset-x-4 bottom-4 space-y-2">
          <h3 className="font-display text-2xl font-black uppercase leading-[0.95] tracking-[-0.02em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {name}
          </h3>
          {shortDescription ? (
            <p className="line-clamp-2 text-xs leading-snug text-white/70">{shortDescription}</p>
          ) : null}
          <div className="inline-flex items-center gap-1.5 pt-1 text-xs font-bold uppercase tracking-wider text-ppb-primary transition-transform group-hover:translate-x-1">
            Ver campeonatos
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
