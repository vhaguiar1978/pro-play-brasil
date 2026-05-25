"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Calendar, Clock, Coins, ImageOff, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusTone } from "./status-badge";

export type TournamentCardData = {
  id: string;
  name: string;
  gameName: string;
  gameSlug: string;
  image: string;
  date: string;
  fee: string | null;
  prize: string;
  registered: number;
  maxPlayers: number;
  status: "open" | "live" | "finished";
};

const STATUS_TONE: Record<TournamentCardData["status"], StatusTone> = {
  open: "open",
  live: "live",
  finished: "finished"
};

type Props = {
  data: TournamentCardData;
  className?: string;
};

export function TournamentCard({ data, className }: Props) {
  const [errored, setErrored] = useState(false);
  const date = new Date(data.date);
  const dataFmt = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  const horaFmt = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const fillPct = Math.min(100, (data.registered / data.maxPlayers) * 100);
  const isOpen = data.status === "open";

  return (
    <article
      className={cn(
        "group relative isolate flex flex-col overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface shadow-ppb-card transition-all duration-300 hover:-translate-y-1 hover:border-ppb-primary/40 hover:shadow-ppb-glow",
        className
      )}
    >
      {/* IMAGEM TOPO */}
      <Link href={`/campeonatos/${data.id}`} className="relative block aspect-[16/10] overflow-hidden">
        {!errored ? (
          <Image
            src={data.image}
            alt={data.gameName}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
              <ImageOff className="h-8 w-8 text-white/30" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ppb-surface via-ppb-surface/30 to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <StatusBadge tone={STATUS_TONE[data.status]} size="sm" />
          <span className="rounded-full border border-ppb-border bg-ppb-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {data.gameName}
          </span>
        </div>
        <div className="absolute inset-x-4 bottom-3">
          <h3 className="font-display text-lg font-black uppercase leading-tight tracking-[-0.01em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {data.name}
          </h3>
        </div>
      </Link>

      {/* CORPO */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Métricas em linha */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Metric icon={<Calendar className="h-3.5 w-3.5" />} label="Data">{dataFmt}</Metric>
          <Metric icon={<Clock className="h-3.5 w-3.5" />} label="Hora">{horaFmt}</Metric>
          <Metric icon={<Coins className="h-3.5 w-3.5" />} label="Inscrição">{data.fee ?? "Grátis"}</Metric>
          <Metric icon={<Users className="h-3.5 w-3.5" />} label="Vagas">{data.registered}/{data.maxPlayers}</Metric>
        </div>

        {/* Premiação */}
        <div className="rounded-xl border border-ppb-gold/20 bg-gradient-to-r from-ppb-gold/10 via-ppb-surface to-ppb-surface px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 shrink-0 text-ppb-gold" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-gold/80">Premiação</div>
              <div className="truncate text-sm font-black text-ppb-text">{data.prize}</div>
            </div>
          </div>
        </div>

        {/* Barra de vagas */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
            <span>Vagas</span>
            <span>{Math.round(fillPct)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ppb-subtle">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ppb-primary to-ppb-primaryHover shadow-[0_0_8px_rgba(255,106,0,0.6)] transition-all duration-700"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <Link
          href={isOpen ? `/campeonatos/${data.id}/inscricao` : `/campeonatos/${data.id}`}
          className={cn(
            "mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95",
            isOpen
              ? "bg-ppb-primary text-white shadow-ppb-glow hover:bg-ppb-primaryHover"
              : "border border-ppb-border bg-ppb-subtle text-ppb-muted hover:border-ppb-borderStrong hover:text-ppb-text"
          )}
        >
          {isOpen ? "Participar agora" : data.status === "live" ? "Acompanhar" : "Ver detalhes"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function Metric({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-ppb-subtle/60 px-2.5 py-2 ring-1 ring-ppb-border">
      <span className="text-ppb-primary">{icon}</span>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wider text-ppb-mutedSoft">{label}</div>
        <div className="truncate font-bold text-ppb-text">{children}</div>
      </div>
    </div>
  );
}
