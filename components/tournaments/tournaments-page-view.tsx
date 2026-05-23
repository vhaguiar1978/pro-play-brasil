import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Flame,
  Radio,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { GAMES, getGameBySlug, getVisibleGames } from "@/lib/games";
import { getAllTournaments, type MockTournament } from "@/lib/mock-tournaments";

type FilterStatus = "all" | "available" | "soon" | "finished";

type TournamentCard =
  | {
      type: "tournament";
      id: string;
      gameSlug: string;
      title: string;
      coverImage: string;
      prize: string;
      feeLabel: string | null;
      maxPlayers: number;
      registered: number;
      platform: string;
      regionLabel: string;
      startDate: string;
      status: MockTournament["status"];
      statusLabel: string;
      statusTone: string;
      detailsHref: string;
      actionHref: string;
      actionLabel: string;
      gameName: string;
      gameDescription: string;
    }
  | {
      type: "soon";
      id: string;
      gameSlug: string;
      title: string;
      coverImage: string;
      prize: string;
      feeLabel: string | null;
      maxPlayers: number | null;
      registered: number;
      platform: string;
      regionLabel: string;
      startDate: string | null;
      status: "soon";
      statusLabel: string;
      statusTone: string;
      detailsHref: string;
      actionHref: string;
      actionLabel: string;
      gameName: string;
      gameDescription: string;
    };

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "available", label: "Disponiveis" },
  { value: "soon", label: "Em breve" },
  { value: "finished", label: "Encerrados" }
];

const visibleLockedGames = getVisibleGames().filter((game) => game.status === "visible_locked");

function toTournamentCard(tournament: MockTournament): TournamentCard {
  const game = getGameBySlug(tournament.gameSlug);
  const isAvailable = tournament.status === "open" || tournament.status === "live";

  return {
    type: "tournament",
    id: tournament.id,
    gameSlug: tournament.gameSlug,
    title: tournament.name,
    coverImage: game?.coverImage ?? "/pro-play-arena-splash.png",
    prize: tournament.prize,
    feeLabel: tournament.feeLabel,
    maxPlayers: tournament.maxPlayers,
    registered: tournament.registered,
    platform: tournament.platform,
    regionLabel: tournament.regionLabel,
    startDate: tournament.startDate,
    status: tournament.status,
    statusLabel:
      tournament.status === "open" ? "Inscricoes abertas" : tournament.status === "live" ? "Ao vivo" : "Encerrado",
    statusTone:
      tournament.status === "open"
        ? "bg-ppb-primary text-white"
        : tournament.status === "live"
          ? "bg-emerald-500 text-white"
          : "bg-white/90 text-[#11131a]",
    detailsHref: `/campeonatos/${tournament.id}`,
    actionHref: tournament.status === "open" ? `/campeonatos/${tournament.id}/inscricao` : `/campeonatos/${tournament.id}`,
    actionLabel: tournament.status === "open" ? "Fazer inscricao" : isAvailable ? "Acompanhar" : "Ver resultado",
    gameName: game?.name ?? tournament.gameSlug,
    gameDescription: game?.shortDescription ?? "Competicao oficial na plataforma Pro Play Brasil."
  };
}

function toComingSoonCard(gameSlug: string): TournamentCard | null {
  const game = GAMES.find((item) => item.slug === gameSlug);
  if (!game) return null;

  return {
    type: "soon",
    id: `soon-${game.slug}`,
    gameSlug: game.slug,
    title: `${game.name} Next Stage`,
    coverImage: game.coverImage,
    prize: "Modalidade aguardando abertura oficial",
    feeLabel: null,
    maxPlayers: null,
    registered: 0,
    platform: "A definir",
    regionLabel: "Brasil",
    startDate: null,
    status: "soon",
    statusLabel: "Em breve",
    statusTone: "bg-sky-400/20 text-sky-300",
    detailsHref: `/jogos/${game.slug}`,
    actionHref: "/suporte",
    actionLabel: "Quero ser avisado",
    gameName: game.name,
    gameDescription: game.shortDescription
  };
}

export function TournamentsPageView() {
  const [activeGame, setActiveGame] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<FilterStatus>("all");

  const items = useMemo(() => {
    const tournamentCards = getAllTournaments().map(toTournamentCard);
    const soonCards = visibleLockedGames.map((game) => toComingSoonCard(game.slug)).filter((card): card is TournamentCard => Boolean(card));
    return [...tournamentCards, ...soonCards];
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesGame = activeGame === "all" || item.gameSlug === activeGame;

      const matchesStatus =
        activeStatus === "all" ||
        (activeStatus === "available" && item.type === "tournament" && (item.status === "open" || item.status === "live")) ||
        (activeStatus === "soon" && item.type === "soon") ||
        (activeStatus === "finished" && item.type === "tournament" && item.status === "finished");

      return matchesGame && matchesStatus;
    });
  }, [activeGame, activeStatus, items]);

  const availableCount = items.filter((item) => item.type === "tournament" && (item.status === "open" || item.status === "live")).length;
  const soonCount = items.filter((item) => item.type === "soon").length;
  const finishedCount = items.filter((item) => item.type === "tournament" && item.status === "finished").length;

  return (
    <div className="bg-[#06070b] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.22),_transparent_24%),radial-gradient(circle_at_78%_20%,_rgba(71,162,255,0.16),_transparent_22%),linear-gradient(180deg,_#090A10_0%,_#06070B_100%)]" />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-14 pt-10 md:px-6 md:pb-20 md:pt-14">
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
              <Flame className="h-3.5 w-3.5 text-ppb-primary" />
              Central de campeonatos
            </div>
            <h1 className="font-display text-4xl uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
              Escolha o jogo, leia o status e entre no proximo torneio.
            </h1>
            <p className="max-w-3xl text-sm leading-8 text-white/68 sm:text-base">
              A tela de campeonatos agora organiza eventos disponiveis, modalidades em breve e competicoes encerradas
              com leitura premium, filtros claros e CTA direto para detalhes ou inscricao.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatusSpotlight icon={<Radio className="h-4 w-4" />} label="Disponiveis" value={availableCount} tone="text-emerald-300" />
            <StatusSpotlight icon={<Sparkles className="h-4 w-4" />} label="Em breve" value={soonCount} tone="text-sky-300" />
            <StatusSpotlight icon={<Trophy className="h-4 w-4" />} label="Encerrados" value={finishedCount} tone="text-white/72" />
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-[#0e1018]/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] md:p-6">
          <SectionHeading
            eyebrow="Filtros"
            title="Refine por jogo ou status e encontre a competicao certa."
            description="A filtragem foi reorganizada para acelerar a descoberta de torneios e manter o mobile claro."
            theme="dark"
          />

          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={activeGame === "all"} onClick={() => setActiveGame("all")}>
                Todos os jogos
              </FilterChip>
              {GAMES.map((game) => (
                <FilterChip key={game.slug} active={activeGame === game.slug} onClick={() => setActiveGame(game.slug)}>
                  {game.name}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((status) => (
                <FilterChip
                  key={status.value}
                  active={activeStatus === status.value}
                  onClick={() => setActiveStatus(status.value)}
                  size="sm"
                >
                  {status.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-dashed border-white/12 bg-[#10131b] px-6 py-16 text-center">
            <Trophy className="h-10 w-10 text-white/35" />
            <div>
              <h2 className="text-xl font-bold text-white">Nenhum campeonato encontrado</h2>
              <p className="mt-1 text-sm text-white/58">Troque os filtros ou volte em instantes para ver novas aberturas.</p>
            </div>
            <ButtonLink href="/criar-campeonato" variant="secondary" className="border-white/12 bg-white/7 text-white hover:border-white/24 hover:bg-white/12 hover:text-white">
              Criar campeonato
            </ButtonLink>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#11131a] transition hover:-translate-y-1 hover:border-ppb-primary/35 hover:shadow-[0_22px_80px_rgba(255,106,0,0.12)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,7,11,0.2),rgba(6,7,11,0.82)_78%,rgba(6,7,11,0.96)_100%)]" />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/74 backdrop-blur">
                      {item.gameName}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] ${item.statusTone}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  <div className="absolute inset-x-4 bottom-4 space-y-2">
                    <h2 className="text-2xl font-black leading-tight text-white">{item.title}</h2>
                    <p className="line-clamp-2 text-sm leading-6 text-white/64">{item.gameDescription}</p>
                  </div>
                </div>

                <div className="grid gap-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <CardMetric
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="Data e horario"
                      value={item.startDate ? formatDateTime(item.startDate) : "Abertura em breve"}
                    />
                    <CardMetric
                      icon={<Ticket className="h-4 w-4" />}
                      label="Inscricao"
                      value={item.feeLabel ?? "Gratis"}
                    />
                    <CardMetric
                      icon={<Trophy className="h-4 w-4" />}
                      label="Premiacao"
                      value={item.prize}
                    />
                    <CardMetric
                      icon={<Users className="h-4 w-4" />}
                      label="Vagas"
                      value={item.maxPlayers ? `${item.registered}/${item.maxPlayers}` : "A definir"}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.04] px-4 py-3">
                    <div>
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">Plataforma</div>
                      <div className="mt-1 text-sm font-semibold text-white">{item.platform}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">Regiao</div>
                      <div className="mt-1 text-sm font-semibold text-white">{item.regionLabel}</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ButtonLink href={item.detailsHref} variant="secondary" className="justify-center border-white/12 bg-white/7 text-white hover:border-white/24 hover:bg-white/12 hover:text-white">
                      Ver detalhes
                    </ButtonLink>
                    <ButtonLink href={item.actionHref} className="justify-center">
                      {item.actionLabel}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </ButtonLink>
                  </div>

                  {item.type === "tournament" && item.status === "open" ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <ShieldCheck className="h-4 w-4" />
                      Inscricao aberta com CTA direto para a pagina do campeonato.
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDateTime(dateValue: string) {
  const date = new Date(dateValue);

  return `${date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  })} • ${date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function FilterChip({
  active,
  onClick,
  children,
  size = "md"
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border font-semibold transition ${
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${
        active
          ? "border-ppb-primary bg-ppb-primary text-white shadow-ppb-glow"
          : "border-white/12 bg-white/6 text-white/68 hover:border-white/24 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function StatusSpotlight({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
      <div className={`inline-flex items-center gap-2 text-sm font-semibold ${tone}`}>
        {icon}
        {label}
      </div>
      <div className="mt-3 font-display text-4xl uppercase tracking-[-0.05em] text-white">{value}</div>
    </div>
  );
}

function CardMetric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/40">
        <span className="text-ppb-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
