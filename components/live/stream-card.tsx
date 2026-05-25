"use client";

import Image from "next/image";
import { ExternalLink, Eye, Radio, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { getGameBySlug } from "@/lib/games";

export type StreamCardData = {
  nickname: string;
  gameSlug: string;
  twitchUrl: string;
  title: string;
  startedAt: string;
  /** Se for true, mostra selo "Jogando o campeonato X" */
  playingTournamentName?: string;
};

type Props = {
  data: StreamCardData;
  compact?: boolean;
  className?: string;
};

function elapsedSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r > 0 ? `há ${h}h ${r}min` : `há ${h}h`;
}

export function StreamCard({ data, compact, className }: Props) {
  const game = getGameBySlug(data.gameSlug);

  return (
    <a
      href={data.twitchUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-500/40 hover:shadow-[0_0_28px_rgba(244,63,94,0.25)]",
        className
      )}
    >
      {/* THUMBNAIL = banner do jogo com overlay */}
      <div className={cn("relative overflow-hidden", compact ? "aspect-[16/9]" : "aspect-[16/9]")}>
        {game ? (
          <Image
            src={game.heroImage}
            alt={game.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 to-ppb-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ppb-surface via-transparent to-ppb-background/40" />

        {/* Selo AO VIVO */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white shadow-[0_0_8px_currentColor]" />
          Ao vivo
        </div>

        {/* Tempo no ar */}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ppb-background/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
          <Eye className="h-3 w-3" />
          {elapsedSince(data.startedAt)}
        </div>

        {/* Game watermark */}
        {game ? (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ppb-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            <div
              className="h-3 w-3 rounded-sm bg-cover bg-center"
              style={{ backgroundImage: `url(${game.coverImage})` }}
            />
            {game.name}
          </div>
        ) : null}

        {/* Selo de campeonato */}
        {data.playingTournamentName ? (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ppb-primary/90 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
            <Trophy className="h-3 w-3" />
            Disputando
          </div>
        ) : null}
      </div>

      {/* INFO */}
      <div className="flex flex-1 items-start gap-3 p-4">
        <PlayerAvatar nick={data.nickname} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-ppb-text">{data.nickname}</div>
          <div className="line-clamp-2 text-xs leading-snug text-ppb-muted">
            {data.title || "Transmissão em andamento"}
          </div>
          {data.playingTournamentName ? (
            <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
              ⚡ {data.playingTournamentName}
            </div>
          ) : null}
        </div>
        <Radio className="h-4 w-4 shrink-0 text-rose-400 transition-transform group-hover:scale-110" />
      </div>

      {/* CTA */}
      <div className="border-t border-ppb-border bg-ppb-subtle/40 px-4 py-2.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 transition-colors group-hover:text-rose-200">
          Assistir na Twitch
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </a>
  );
}
