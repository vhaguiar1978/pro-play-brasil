"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronRight, Filter, Radio, Search, Sparkles, Trophy, Users } from "lucide-react";
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

const AGENDA_BLOCKS = [
  {
    time: "18:00",
    title: "Check-in e lineup",
    copy: "Times confirmam presença e fecham a formação da rodada.",
    status: "Pré-jogo"
  },
  {
    time: "20:00",
    title: "Rodada principal",
    copy: "Partidas ao vivo com ranking, tabela e destaque para transmissão.",
    status: "Hoje"
  },
  {
    time: "23:59",
    title: "Envio de resultado",
    copy: "Janela final para score, disputa e contestação com leitura clara.",
    status: "Pendente"
  }
] as const;

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

  const localTournaments = useMemo(() => getAllTournaments(), []);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => setServerList(data.tournaments ?? []))
      .catch(() => setServerList([]));
  }, []);

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

  const stats = useMemo(
    () => ({
      total: allTournaments.length,
      open: allTournaments.filter((t) => t.status === "open").length,
      live: allTournaments.filter((t) => t.status === "live").length,
      finished: allTournaments.filter((t) => t.status === "finished").length
    }),
    [allTournaments]
  );

  const gameCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of allTournaments) map[t.gameSlug] = (map[t.gameSlug] ?? 0) + 1;
    return map;
  }, [allTournaments]);

  const visibleGames = useMemo(() => getVisibleGames().slice(0, 4), []);
  const heroTournament = filtered[0] ?? allTournaments[0];
  const hasActiveFilter = status !== "all" || game !== "all" || query.trim().length > 0;

  function clearFilters() {
    setStatus("all");
    setGame("all");
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-12 pb-20 md:gap-16 md:pb-24">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#05070c]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.24),_transparent_28%),radial-gradient(circle_at_82%_18%,_rgba(53,194,255,0.18),_transparent_22%),linear-gradient(180deg,_#090d15_0%,_#05070c_55%,_#05070c_100%)]" />
        <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[140px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />

        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-14 pt-12 md:px-6 lg:grid-cols-[1.05fr,0.95fr] lg:pb-20 lg:pt-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              <Sparkles className="h-3 w-3" />
              Central de campeonatos
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
                Escolha o próximo evento e entre com tudo.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Aqui o usuário precisa entender o campeonato em segundos: status, agenda, prêmio, valor, vagas e
                caminho para inscrição ou acompanhamento ao vivo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <IconInfoCard tone="primary" icon={<Trophy className="h-5 w-5" />} label="Total" value={stats.total} className="border-white/10 bg-white/[0.05]" />
              <IconInfoCard highlight icon={<Calendar className="h-5 w-5" />} label="Abertos" value={stats.open} hint="prontos para entrar" className="border-white/10 bg-white/[0.05]" />
              <IconInfoCard tone="accent" icon={<Radio className="h-5 w-5" />} label="Ao vivo" value={stats.live} hint="acompanhe agora" className="border-white/10 bg-white/[0.05]" />
              <IconInfoCard tone="gold" icon={<Users className="h-5 w-5" />} label="Encerrados" value={stats.finished} hint="histórico" className="border-white/10 bg-white/[0.05]" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_28px_100px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="rounded-[1.6rem] border border-white/10 bg-[#0b1018] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-cyan-300">Evento em destaque</div>
                  <div className="mt-1 text-sm text-white/58">Leitura rápida para conversão</div>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  {heroTournament?.status === "live" ? "Ao vivo" : heroTournament?.status === "finished" ? "Finalizado" : "Aberto"}
                </span>
              </div>

              {heroTournament ? (
                <div className="mt-5 grid gap-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.20),_transparent_26%),linear-gradient(135deg,#111a28_0%,#0a0e15_100%)] p-5">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/50">
                      {getGameBySlug(heroTournament.gameSlug)?.name ?? heroTournament.gameSlug}
                    </div>
                    <h2 className="mt-3 font-display text-3xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white">
                      {heroTournament.name}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/62">
                      {heroTournament.description || "Página feita para valorizar o evento, destacar prêmio e reduzir dúvida na inscrição."}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <EventMetric label="Prêmio" value={heroTournament.prize} />
                      <EventMetric label="Entrada" value={heroTournament.feeLabel ?? "Grátis"} />
                      <EventMetric label="Vagas" value={`${heroTournament.registered}/${heroTournament.maxPlayers}`} />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {AGENDA_BLOCKS.map((item, index) => (
                      <div
                        key={item.title}
                        className={cn(
                          "grid gap-3 rounded-2xl border p-4 md:grid-cols-[88px,1fr,auto]",
                          index === 0 ? "border-ppb-primary/35 bg-ppb-primary/10" : "border-white/10 bg-white/[0.04]"
                        )}
                      >
                        <div className="font-display text-2xl font-black uppercase text-ppb-primary">{item.time}</div>
                        <div>
                          <div className="text-sm font-black uppercase tracking-wider text-white">{item.title}</div>
                          <p className="mt-1 text-sm leading-7 text-white/58">{item.copy}</p>
                        </div>
                        <div className="self-start rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 md:px-6">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b1018]/84 p-4 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/36" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome do campeonato, jogo ou prêmio"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-9 pr-3 text-sm text-white placeholder:text-white/36 focus:border-ppb-primary/50 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((filter) => {
                const active = status === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatus(filter.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                      active
                        ? "border-ppb-primary/60 bg-ppb-primary/15 text-white shadow-ppb-glow"
                        : "border-white/10 bg-white/[0.04] text-white/62 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {filter.label}
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
                : "border-white/10 bg-white/[0.04] hover:border-white/20"
            )}
          >
            <span className={cn("grid h-7 w-7 place-items-center rounded-lg", game === "all" ? "bg-ppb-primary text-white" : "bg-white/[0.07] text-ppb-primary")}>
              <Filter className="h-3.5 w-3.5" />
            </span>
            <span className={cn("text-xs font-bold uppercase tracking-wider", game === "all" ? "text-white" : "text-white/62")}>Todos os jogos</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", game === "all" ? "bg-white/20 text-white" : "bg-white/[0.06] text-white/62")}>
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
                  "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 transition-all disabled:opacity-35",
                  active
                    ? "border-ppb-primary/60 bg-ppb-primary/15 shadow-ppb-glow"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20"
                )}
              >
                <div className="h-7 w-7 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-white/10" style={{ backgroundImage: `url(${g.coverImage})` }} />
                <span className={cn("text-xs font-bold uppercase tracking-wider", active ? "text-white" : "text-white/62")}>{g.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", active ? "bg-white/20 text-white" : "bg-white/[0.06] text-white/62")}>
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
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/62 transition hover:border-ppb-primary/40 hover:text-white"
          >
            Limpar filtros
            <ChevronRight className="h-3 w-3" />
          </button>
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              {filtered.length} {filtered.length === 1 ? "campeonato" : "campeonatos"}
            </div>
            <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-[-0.03em] text-white">
              {hasActiveFilter ? "Resultados filtrados" : "Todos os campeonatos"}
            </h2>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/10 bg-white/[0.04] p-12 text-center">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ppb-primary/10 blur-3xl" />
            <div className="relative">
              <Trophy className="mx-auto h-10 w-10 text-white/30" />
              <h3 className="mt-4 font-display text-xl font-black uppercase text-white">Nenhum campeonato encontrado</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/58">
                Ajuste os filtros ou limpe tudo para voltar para a visão completa.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TournamentCard key={t.id} data={toCard(t)} className="border-white/10 bg-[#0d1420]" />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-white/10 bg-[#080c13]">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">Explore por modalidade</div>
              <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-[-0.03em] text-white">Jogos em destaque</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {visibleGames.map((g) => (
              <GameCard
                key={g.slug}
                name={g.name}
                slug={g.slug}
                image={g.coverImage}
                shortDescription={g.shortDescription}
                status={g.status === "active" ? "active" : "soon"}
                tournamentCount={gameCounts[g.slug] ?? 0}
                className="border-white/10 bg-[#0d1420]"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function EventMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <div className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
