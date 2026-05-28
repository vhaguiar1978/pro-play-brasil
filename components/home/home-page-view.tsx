import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Crown,
  Gamepad2,
  ListOrdered,
  MessageCircle,
  Sparkles,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { GameCard } from "@/components/ui/game-card";
import { TournamentCard, type TournamentCardData } from "@/components/ui/tournament-card";
import { ChampionCard } from "@/components/ui/champion-card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrizeBadge } from "@/components/ui/prize-badge";
import { SuggestGameCard } from "@/components/ui/suggest-game-card";
import { LiveStreamsBoard } from "@/components/live/live-streams-board";
import { GAMES, getGameBySlug, getVisibleGames } from "@/lib/games";
import { getRankingByGameSlug } from "@/lib/mock-rankings";
import { MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";
import { homeStats } from "@/lib/site-content";
import { publicRoutes } from "@/lib/public-routes";
import { cn } from "@/lib/utils";

type Props = {
  bodyFontClass: string;
  displayFontClass: string;
};

const CONTACT_EMAIL = "contato@proplaybrasil.com.br";
const featuredGameSlugs = ["fifa", "free-fire", "call-of-duty", "pubg", "valorant", "counter-strike-2"];
const featuredGames = featuredGameSlugs
  .map((slug) => GAMES.find((game) => game.slug === slug))
  .filter((game): game is (typeof GAMES)[number] => Boolean(game));
const visibleGames = getVisibleGames();
const heroGame = visibleGames[0];
const featuredTournaments = MOCK_TOURNAMENTS.slice(0, 3);

const STEPS = [
  { num: 1, title: "Cadastre-se", description: "Crie sua conta em segundos", icon: Users, color: "from-emerald-500/30 to-emerald-700/20", iconColor: "text-emerald-400" },
  { num: 2, title: "Escolha", description: "Selecione o campeonato", icon: Gamepad2, color: "from-cyan-500/30 to-cyan-700/20", iconColor: "text-cyan-400" },
  { num: 3, title: "Pague", description: "Inscrição via PIX ou cartão", icon: CheckCircle2, color: "from-indigo-500/30 to-indigo-700/20", iconColor: "text-indigo-400" },
  { num: 4, title: "Jogue", description: "Entre no servidor na hora", icon: Zap, color: "from-fuchsia-500/30 to-fuchsia-700/20", iconColor: "text-fuchsia-400" },
  { num: 5, title: "Acompanhe", description: "Tabela e desempenho em tempo real", icon: ListOrdered, color: "from-rose-500/30 to-rose-700/20", iconColor: "text-rose-400" },
  { num: 6, title: "Ganhe", description: "Concorra a prêmios e seja campeão", icon: Trophy, color: "from-amber-400/30 to-amber-600/20", iconColor: "text-ppb-gold" }
];

const AGENDA_PREVIEW = [
  {
    time: "19:30",
    title: "Quartas da Arena",
    copy: "Lobby aberto, lineup confirmado e confronto pronto para entrar ao vivo.",
    status: "Hoje"
  },
  {
    time: "21:00",
    title: "Live oficial",
    copy: "Semifinal transmitida na arena com CTA forte para acompanhar o campeonato.",
    status: "Ao vivo"
  },
  {
    time: "23:59",
    title: "Envio de resultados",
    copy: "Janela de upload e revisão para evitar atrito no fechamento da rodada.",
    status: "Pendente"
  }
] as const;

function buildTournamentCardData(t: (typeof MOCK_TOURNAMENTS)[number]): TournamentCardData {
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

const rankingLeaders = featuredGameSlugs
  .flatMap((slug) =>
    getRankingByGameSlug(slug)
      .slice(0, 1)
      .map((entry) => ({
        ...entry,
        gameSlug: slug,
        gameName: getGameBySlug(slug)?.name ?? slug
      }))
  )
  .sort((a, b) => b.pts - a.pts)
  .slice(0, 6);

const allChampions = GAMES.flatMap((g) =>
  g.champions.slice(0, 1).map((c, i) => ({
    ...c,
    game: g,
    image: g.gallery[(i + 1) % g.gallery.length] ?? g.heroImage
  }))
).slice(0, 4);

export function HomePageView({ bodyFontClass, displayFontClass }: Props) {
  const contactHref = `mailto:${CONTACT_EMAIL}?subject=Contato%20Pro%20Play%20Brasil`;

  return (
    <div className={cn(bodyFontClass, "bg-ppb-background text-white")}>
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10">
          {heroGame ? (
            <Image
              src={heroGame.heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-ppb-background/50 via-ppb-background/80 to-ppb-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-ppb-background via-ppb-background/40 to-transparent" />
          <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-ppb-primary/30 blur-[140px]" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
        </div>

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-12 sm:pb-20 sm:pt-16 md:px-6 lg:grid-cols-[1.2fr,0.8fr] lg:gap-10 lg:pb-28 lg:pt-24">
          <div className="space-y-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Plataforma de campeonatos online
            </div>

            <h1
              className={cn(
                displayFontClass,
                "max-w-4xl text-5xl uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
              )}
            >
              Entre na arena dos campeonatos online
            </h1>

            <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              FIFA, Free Fire, Call of Duty, PUBG e mais. Compita por prêmios reais, suba no ranking e seja lenda.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={publicRoutes.tournaments} size="lg" className="min-w-[220px] shadow-ppb-glow-strong">
                Ver campeonatos
                <ArrowRight className="ml-1 h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href={publicRoutes.signup ?? "/cadastrar"}
                variant="secondary"
                size="lg"
                className="min-w-[220px]"
              >
                Criar conta
              </ButtonLink>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
              {homeStats.map((item) => (
                <div
                  key={item.label}
                  className="relative isolate overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface/70 p-4 backdrop-blur"
                >
                  <div className="absolute -right-6 -top-6 -z-10 h-16 w-16 rounded-full bg-ppb-primary/15 blur-2xl" />
                  <div className={cn(displayFontClass, "text-2xl font-black uppercase text-white sm:text-3xl")}>
                    {item.value}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero side: featured tournament preview */}
          {featuredTournaments[0] ? (
            <div className="relative flex flex-col gap-3 self-end">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Campeonato em destaque
              </div>
              <TournamentCard data={buildTournamentCardData(featuredTournaments[0])} />
            </div>
          ) : null}
        </div>
      </section>

      {/* ─────────────── JOGOS EM DESTAQUE ─────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              Jogos em destaque
            </div>
            <h2 className={cn(displayFontClass, "mt-1 text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl")}>
              Escolha sua modalidade
            </h2>
          </div>
          <Link
            href="/jogos"
            className="hidden items-center gap-1 rounded-full border border-ppb-border bg-ppb-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text sm:inline-flex"
          >
            Todos os jogos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {featuredGames.map((game) => {
            const count = MOCK_TOURNAMENTS.filter((t) => t.gameSlug === game.slug).length;
            return (
              <GameCard
                key={game.slug}
                name={game.name}
                slug={game.slug}
                image={game.coverImage}
                shortDescription={game.shortDescription}
                status={game.status === "active" ? "active" : "soon"}
                tournamentCount={count}
              />
            );
          })}
        </div>
      </section>

      {/* ─────────────── AO VIVO AGORA ─────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <LiveStreamsBoard limit={3} />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              Agenda e retorno
            </div>
            <h2 className={cn(displayFontClass, "text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl")}>
              O sistema precisa dar vontade de voltar todo dia.
            </h2>
            <p className="max-w-xl text-sm leading-8 text-white/72 md:text-base">
              A nova experiência interna do Pro Play Brasil prioriza agenda clara, alertas fortes, transmissão em
              destaque e próximos passos visíveis. Isso faz o usuário abrir a plataforma de novo sem se perder.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Agenda forte", value: "01", copy: "Partidas, check-in e upload em um fluxo rápido." },
                { label: "Arena viva", value: "02", copy: "Live, ranking e feed num hub diário." },
                { label: "Admin rápido", value: "03", copy: "Visão clara para operar sem atrito." }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-ppb-border bg-ppb-surface/70 p-4 backdrop-blur">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">{item.label}</div>
                  <div className={cn(displayFontClass, "mt-2 text-3xl font-black uppercase text-white")}>{item.value}</div>
                  <p className="mt-2 text-xs leading-6 text-ppb-muted">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-ppb-border bg-ppb-surface/80 p-5 shadow-ppb-card backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-ppb-border pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">Preview da agenda</div>
                <h3 className={cn(displayFontClass, "mt-1 text-2xl font-black uppercase text-white")}>Hoje na arena</h3>
              </div>
              <StatusBadge tone="open">Fluxo diário</StatusBadge>
            </div>

            <div className="mt-4 grid gap-3">
              {AGENDA_PREVIEW.map((item, index) => (
                <div
                  key={item.title}
                  className={cn(
                    "grid gap-3 rounded-2xl border p-4 md:grid-cols-[92px,1fr,auto]",
                    index === 0
                      ? "border-ppb-primary/35 bg-ppb-primary/10"
                      : "border-ppb-border bg-ppb-subtle/50"
                  )}
                >
                  <div className={cn(displayFontClass, "text-2xl font-black uppercase text-ppb-primary")}>{item.time}</div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-wider text-white">{item.title}</div>
                    <p className="mt-1 text-sm leading-7 text-ppb-muted">{item.copy}</p>
                  </div>
                  <div className="self-start rounded-full border border-ppb-border bg-ppb-background/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── CAMPEONATOS EM DESTAQUE ─────────────── */}
      <section className="border-y border-ppb-border bg-ppb-subtle/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                Campeonatos
              </div>
              <h2 className={cn(displayFontClass, "mt-1 text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl")}>
                Em destaque agora
              </h2>
            </div>
            <ButtonLink
              href={publicRoutes.tournaments}
              variant="secondary"
              className="hidden sm:inline-flex"
            >
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </ButtonLink>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredTournaments.map((t) => (
              <TournamentCard key={t.id} data={buildTournamentCardData(t)} />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── RANKING + COMO FUNCIONA ─────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
          {/* RANKING COMPACTO */}
          <div className="rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
            <div className="flex items-center justify-between gap-4 border-b border-ppb-border px-6 py-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                  Ranking geral
                </div>
                <h2 className={cn(displayFontClass, "mt-1 text-2xl font-black uppercase text-white")}>
                  Top jogadores
                </h2>
              </div>
              <Link
                href="/ranking"
                className="inline-flex items-center gap-1 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
              >
                Ver ranking
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="divide-y divide-ppb-border">
              {rankingLeaders.map((e, idx) => {
                const pos = idx + 1;
                const isTop = pos <= 3;
                const topBg = pos === 1
                  ? "bg-gradient-to-r from-ppb-gold/15 to-transparent"
                  : pos === 2
                    ? "bg-gradient-to-r from-white/10 to-transparent"
                    : pos === 3
                      ? "bg-gradient-to-r from-amber-700/10 to-transparent"
                      : "";
                return (
                  <li
                    key={`${e.gameSlug}-${e.nick}`}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-ppb-subtle/40",
                      isTop && topBg
                    )}
                  >
                    <span
                      className={cn(
                        displayFontClass,
                        "w-8 text-lg font-black",
                        pos === 1 ? "text-ppb-gold" : pos === 2 ? "text-white" : pos === 3 ? "text-amber-500" : "text-ppb-muted"
                      )}
                    >
                      #{pos}
                    </span>
                    <PlayerAvatar nick={e.nick} position={isTop ? (pos as 1 | 2 | 3) : undefined} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-ppb-text">{e.nick}</div>
                      <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                        {e.gameName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(displayFontClass, "text-sm font-black text-ppb-text")}>
                        {e.pts.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                        {e.wins} vit
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* COMO FUNCIONA */}
          <div>
            <div className="mb-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                Como funciona
              </div>
              <h2 className={cn(displayFontClass, "mt-1 text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl")}>
                Em 6 passos
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="group relative isolate overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface p-4 transition-all hover:-translate-y-0.5 hover:border-ppb-borderStrong"
                  >
                    <div className={cn("absolute -right-6 -top-6 -z-10 h-16 w-16 rounded-full bg-gradient-to-br blur-2xl opacity-60", step.color)} />
                    <div className="flex items-center gap-2">
                      <span className={cn(displayFontClass, "text-2xl font-black text-ppb-mutedSoft")}>
                        0{step.num}
                      </span>
                      <span className={cn("ml-auto grid h-9 w-9 place-items-center rounded-xl bg-ppb-subtle ring-1 ring-ppb-border", step.iconColor)}>
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-3 text-sm font-black uppercase tracking-wider text-ppb-text">
                      {step.title}
                    </div>
                    <p className="mt-1 text-xs leading-snug text-ppb-muted">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── SUGESTÃO DE JOGO ─────────────── */}
      <SuggestGameCard />

      {/* ─────────────── ÚLTIMOS CAMPEÕES ─────────────── */}
      {allChampions.length > 0 ? (
        <section className="border-y border-ppb-border bg-ppb-subtle/30">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                  <Crown className="mr-1 inline h-3 w-3" />
                  Hall da fama
                </div>
                <h2 className={cn(displayFontClass, "mt-1 text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl")}>
                  Últimos campeões
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {allChampions.map((c) => (
                <ChampionCard
                  key={`${c.game.slug}-${c.name}`}
                  name={c.name}
                  title={`${c.game.name} · ${c.season}`}
                  image={c.image}
                  prize={c.title}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─────────────── CTA FINAL ─────────────── */}
      <section className="relative overflow-hidden border-t border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/20 via-ppb-background to-ppb-background" />
        <div className="absolute -left-32 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-ppb-primary/30 blur-[140px]" />
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
            <div className="space-y-5">
              <StatusBadge tone="open">Inscrições abertas</StatusBadge>
              <h2 className={cn(displayFontClass, "text-4xl font-black uppercase leading-[0.9] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl")}>
                Monte seu time. Entre na arena.
              </h2>
              <p className="max-w-xl text-base leading-7 text-white/75">
                Crie sua conta agora e dispute o próximo campeonato com prêmios reais.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <ButtonLink href={publicRoutes.signup ?? "/cadastrar"} size="lg" className="shadow-ppb-glow-strong">
                  Criar conta grátis
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
                <ButtonLink href={contactHref} variant="secondary" size="lg">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar com suporte
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-3xl border border-ppb-gold/30 bg-gradient-to-br from-ppb-gold/15 via-ppb-surface to-ppb-surface p-6 shadow-[0_0_60px_rgba(243,178,79,0.18)]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                <Trophy className="h-3 w-3" />
                Prêmios já distribuídos
              </div>
              <div className={cn(displayFontClass, "mt-3 text-5xl font-black uppercase tracking-[-0.04em] text-white sm:text-6xl")}>
                R$ 32k+
              </div>
              <div className="mt-2 text-sm text-ppb-muted">em mais de 68 campeonatos operados.</div>

              <div className="mt-6 space-y-2">
                <PrizeBadge prize="Prêmios em dinheiro" size="sm" className="w-full justify-start" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-ppb-subtle/60 px-2.5 py-2 ring-1 ring-ppb-border">
                    <Users className="h-3.5 w-3.5 text-ppb-primary" />
                    <span className="font-bold text-ppb-text">240+ times</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-ppb-subtle/60 px-2.5 py-2 ring-1 ring-ppb-border">
                    <Calendar className="h-3.5 w-3.5 text-ppb-primary" />
                    <span className="font-bold text-ppb-text">68 eventos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
