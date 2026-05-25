"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Filter,
  Search,
  Sparkles,
  Trophy,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCard } from "@/components/ui/game-card";
import { IconInfoCard } from "@/components/ui/icon-info-card";
import { TournamentCard, type TournamentCardData } from "@/components/ui/tournament-card";
import { GAMES, getGameBySlug, getVisibleGames } from "@/lib/games";
import { getAllTournaments, type MockTournament } from "@/lib/mock-tournaments";

type StatusFilter = "all" | "open" | "live" | "finished";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Inscrições abertas" },
  { value: "live", label: "Ao vivo" },
  { value: "finished", label: "Encerrados" }
];

function toCard(t: MockTournament): TournamentCardData {
  const game = getGameBySlug(t.gameSlug);
  return {
    id: t.id,
    name: t.name,
    gameName: game?.name ?? t.gameSlug,
    gameSlug: t.gameSlug,
    image: game?.coverImage ?? game?.heroImage ?? "",
    date: t.startDate,
    fee: t.feeLabel,
    prize: t.prize,
    registered: t.registered,
    maxPlayers: t.maxPlayers,
    status: t.status
  };
}

export function TournamentsPageView() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [game, setGame] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [serverList, setServerList] = useState<MockTournament[]>([]);

  // Mock + localStorage (sync)
  const localTournaments = useMemo(() => getAllTournaments(), []);

  // Server custom (criados pelo admin)
  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => setServerList(data.tournaments ?? []))
      .catch(() => setServerList([]));
  }, []);

  // Mescla sem duplicar (server tem prioridade sobre IDs iguais)
  const allTournaments = useMemo(() => {
    const map = new Map<string, MockTournament>();
    for (const t of localTournaments) map.set(t.id, t);
    for (const t of serverList) map.set(t.id, t);
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [localTournaments, serverList]);

  const filtered = useMemo(() => {
    let list = allTournaments;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (game !== "all") list = list.filter((t) => t.gameSlug === game);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (getGameBySlug(t.gameSlug)?.name ?? "").toLowerCase().includes(q) ||
          t.prize.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTournaments, status, game, query]);

  const stats = useMemo(() => {
    return {
      total: allTournaments.length,
      open: allTournaments.filter((t) => t.status === "open").length,
      live: allTournaments.filter((t) => t.status === "live").length,
      finished: allTournaments.filter((t) => t.status === "finished").length
    };
  }, [allTournaments]);

  const gameCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of allTournaments) map[t.gameSlug] = (map[t.gameSlug] ?? 0) + 1;
    return map;
  }, [allTournaments]);

  const upcomingGames = useMemo(() => getVisibleGames().slice(0, 4), []);

  function clearFilters() {
    setStatus("all");
    setGame("all");
    setQuery("");
  }
  const hasActiveFilter = status !== "all" || game !== "all" || query.trim().length > 0;

  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/20 via-ppb-background to-ppb-background" />
        <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/30 blur-[140px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-16">
          <div className="flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
              <Trophy className="h-3 w-3" />
              Campeonatos
            </div>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
              Encontre o seu
              <br />
              <span className="text-ppb-primary">próximo título.</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Use os filtros pra achar o campeonato certo: por jogo, status ou nome.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <IconInfoCard tone="primary" icon={<Sparkles className="h-5 w-5" />} label="Total" value={stats.total} />
            <IconInfoCard highlight icon={<Calendar className="h-5 w-5" />} label="Abertos" value={stats.open} hint="inscreva-se" />
            <IconInfoCard tone="accent" icon={<Users className="h-5 w-5" />} label="Ao vivo" value={stats.live} hint="acompanhe agora" />
            <IconInfoCard tone="primary" icon={<Trophy className="h-5 w-5" />} label="Encerrados" value={stats.finished} hint="histórico" />
          </div>
        </div>
      </section>

      {/* ─────────────── FILTROS ─────────────── */}
      <section className="mx-auto w-full max-w-7xl space-y-4 px-4 md:px-6">
        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome do campeonato, jogo ou prêmio"
                className="w-full rounded-xl border border-ppb-border bg-ppb-subtle py-2.5 pl-9 pr-3 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => {
                const active = status === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setStatus(f.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                      active
                        ? "border-ppb-primary/60 bg-ppb-primary/15 text-ppb-text shadow-ppb-glow"
                        : "border-ppb-border bg-ppb-subtle text-ppb-muted hover:border-ppb-borderStrong hover:text-ppb-text"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setGame("all")}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 transition-all",
              game === "all"
                ? "border-ppb-primary/60 bg-ppb-primary/15 shadow-ppb-glow"
                : "border-ppb-border bg-ppb-surface/60 hover:border-ppb-borderStrong"
            )}
          >
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-lg ring-1 ring-ppb-border",
                game === "all" ? "bg-ppb-primary text-white" : "bg-ppb-subtle text-ppb-primary"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
            </span>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                game === "all" ? "text-white" : "text-ppb-muted"
              )}
            >
              Todos os jogos
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-black",
                game === "all" ? "bg-white/20 text-white" : "bg-ppb-subtle text-ppb-muted"
              )}
            >
              {stats.total}
            </span>
          </button>

          {GAMES.map((g) => {
            const active = game === g.slug;
            const count = gameCounts[g.slug] ?? 0;
            return (
              <button
                key={g.slug}
                type="button"
                onClick={() => setGame(g.slug)}
                disabled={count === 0}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 transition-all disabled:opacity-40",
                  active
                    ? "border-ppb-primary/60 bg-ppb-primary/15 shadow-ppb-glow"
                    : "border-ppb-border bg-ppb-surface/60 hover:border-ppb-borderStrong"
                )}
              >
                <div
                  className="h-7 w-7 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-ppb-border"
                  style={{ backgroundImage: `url(${g.coverImage})` }}
                />
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    active ? "text-white" : "text-ppb-muted"
                  )}
                >
                  {g.name}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    active ? "bg-white/20 text-white" : "bg-ppb-subtle text-ppb-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {hasActiveFilter ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        ) : null}
      </section>

      {/* ─────────────── RESULTADOS ─────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              {filtered.length} {filtered.length === 1 ? "campeonato" : "campeonatos"}
            </div>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
              {status === "all" && game === "all" && !query
                ? "Todos os campeonatos"
                : "Resultados"}
            </h2>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-12 text-center">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ppb-primary/10 blur-3xl" />
            <div className="relative">
              <Trophy className="mx-auto h-10 w-10 text-ppb-mutedSoft" />
              <h3 className="mt-4 font-display text-xl font-black uppercase text-ppb-text">
                Nenhum campeonato encontrado
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-ppb-muted">
                Tente ajustar os filtros ou{" "}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-bold text-ppb-primary hover:underline"
                >
                  limpe todos
                </button>{" "}
                pra ver todos os campeonatos.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TournamentCard key={t.id} data={toCard(t)} />
            ))}
          </div>
        )}
      </section>

      {/* ─────────────── EXPLORAR JOGOS ─────────────── */}
      <section className="border-t border-ppb-border bg-ppb-subtle/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Explore por modalidade
              </div>
              <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
                Jogos em destaque
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {upcomingGames.map((g) => (
              <GameCard
                key={g.slug}
                name={g.name}
                slug={g.slug}
                image={g.coverImage}
                shortDescription={g.shortDescription}
                status={g.status === "active" ? "active" : "soon"}
                tournamentCount={gameCounts[g.slug] ?? 0}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
