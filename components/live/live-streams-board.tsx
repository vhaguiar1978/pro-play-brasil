"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Loader2, Radio, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES } from "@/lib/games";
import { StreamCard, type StreamCardData } from "./stream-card";

type StreamItem = {
  nickname: string;
  gameSlug: string;
  twitchUrl: string;
  title: string;
  startedAt: string;
  updatedAt: string;
};

type Props = {
  /** Quando passado, restringe a streams desse jogo (esconde o filtro de jogos). */
  gameSlug?: string;
  /** Mostra cabeçalho + botão refresh. */
  showHeader?: boolean;
  /** Limita N cards exibidos. */
  limit?: number;
  className?: string;
};

export function LiveStreamsBoard({ gameSlug, showHeader = true, limit, className }: Props) {
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<string>("all");

  const fetchStreams = useCallback(async () => {
    setLoading(true);
    try {
      const url = gameSlug ? `/api/streams?game=${gameSlug}` : "/api/streams";
      const r = await fetch(url);
      const data = await r.json();
      setStreams(data.streams ?? []);
    } catch {
      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, [gameSlug]);

  useEffect(() => {
    fetchStreams();
    // Auto-refresh a cada 60s pra reflectir quem entra/sai do ar
    const id = setInterval(fetchStreams, 60_000);
    return () => clearInterval(id);
  }, [fetchStreams]);

  // Contagem por jogo (pros tiles)
  const countsByGame = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of streams) {
      map[s.gameSlug] = (map[s.gameSlug] ?? 0) + 1;
    }
    return map;
  }, [streams]);

  const filtered = useMemo(() => {
    const list = activeGame === "all" || gameSlug ? streams : streams.filter((s) => s.gameSlug === activeGame);
    return limit ? list.slice(0, limit) : list;
  }, [streams, activeGame, gameSlug, limit]);

  return (
    <div className={cn("space-y-5", className)}>
      {showHeader ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400 shadow-[0_0_8px_currentColor]" />
              Ao vivo agora
            </div>
            <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
              <Radio className="h-5 w-5 text-rose-400" />
              Transmissões
              <span className="font-display text-2xl font-black text-rose-300">
                {loading ? "—" : streams.length}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchStreams}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Atualizar
          </button>
        </div>
      ) : null}

      {/* TILES DE JOGOS (filtro) */}
      {!gameSlug ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <GameTile
            label="Todos"
            count={streams.length}
            active={activeGame === "all"}
            onClick={() => setActiveGame("all")}
          />
          {GAMES.map((g) => {
            const count = countsByGame[g.slug] ?? 0;
            return (
              <GameTile
                key={g.slug}
                label={g.name}
                image={g.coverImage}
                count={count}
                active={activeGame === g.slug}
                disabled={count === 0}
                onClick={() => setActiveGame(g.slug)}
              />
            );
          })}
        </div>
      ) : null}

      {/* GRID DE STREAMS */}
      {loading && streams.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-12">
          <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyLive game={activeGame !== "all" ? GAMES.find((g) => g.slug === activeGame)?.name : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StreamCard key={s.nickname} data={s as StreamCardData} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameTile({
  label,
  image,
  count,
  active,
  disabled,
  onClick
}: {
  label: string;
  image?: string;
  count: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex w-28 shrink-0 flex-col items-stretch overflow-hidden rounded-2xl border transition-all duration-200 disabled:opacity-40",
        active
          ? "border-rose-500/60 shadow-[0_0_24px_rgba(244,63,94,0.3)]"
          : "border-ppb-border hover:border-ppb-borderStrong"
      )}
    >
      <div className="relative aspect-[4/5] bg-ppb-subtle">
        {image ? (
          <Image src={image} alt={label} fill sizes="112px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-rose-500/30 to-ppb-background">
            <Filter className="h-6 w-6 text-rose-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ppb-background via-ppb-background/40 to-transparent" />
        {count > 0 ? (
          <div className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-lg">
            <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
            {count}
          </div>
        ) : null}
      </div>
      <div className="bg-ppb-surface px-2 py-2">
        <div
          className={cn(
            "truncate text-[10px] font-bold uppercase tracking-wider",
            active ? "text-rose-300" : "text-ppb-muted"
          )}
        >
          {label}
        </div>
      </div>
    </button>
  );
}

function EmptyLive({ game }: { game?: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-10 text-center">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ppb-subtle text-ppb-mutedSoft ring-1 ring-ppb-border">
          <Radio className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-display text-lg font-black uppercase text-ppb-text">
          {game ? `Ninguém transmitindo ${game} agora` : "Ninguém ao vivo agora"}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-ppb-muted">
          Quando jogadores ligarem o modo transmissão no perfil, aparecem aqui.
        </p>
      </div>
    </div>
  );
}
