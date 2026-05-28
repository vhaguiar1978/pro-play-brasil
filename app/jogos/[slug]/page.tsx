import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Crown,
  Flame,
  Gamepad2,
  ListOrdered,
  Lock,
  MessageCircle,
  Sparkles,
  Swords,
  Trophy,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconInfoCard } from "@/components/ui/icon-info-card";
import { GameGallery } from "@/components/ui/game-gallery";
import { TournamentCard, type TournamentCardData } from "@/components/ui/tournament-card";
import { ChampionCard } from "@/components/ui/champion-card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { getGameBySlug } from "@/lib/games";
import { getRankingByGameSlug } from "@/lib/mock-rankings";
import { getTournamentsByGameSlug, type MockTournament } from "@/lib/mock-tournaments";
import { cn } from "@/lib/utils";
import { LockedGameView } from "@/components/ui/locked-game-view";
import { countClicksBySlug } from "@/lib/interest-storage";
import { applyOverride, readGamesOverrides } from "@/lib/games-overrides-storage";

type Props = { params: Promise<{ slug: string }> };

function toCardData(tournament: MockTournament, image: string, gameName: string): TournamentCardData {
  return {
    id: tournament.id,
    name: tournament.name,
    gameName,
    gameSlug: tournament.gameSlug,
    image,
    date: tournament.startDate,
    fee: tournament.feeLabel,
    prize: tournament.prize,
    registered: tournament.registered,
    maxPlayers: tournament.maxPlayers,
    status: tournament.status
  };
}

function formatStageDate(date: string) {
  return new Date(date)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

export default async function JogoPage({ params }: Props) {
  const { slug } = await params;
  const rawGame = getGameBySlug(slug);
  if (!rawGame) notFound();

  const overrides = await readGamesOverrides();
  const game = applyOverride(rawGame, overrides[slug]);

  if (game.runtimeStatus === "frozen") {
    const initialCount = await countClicksBySlug(game.slug);
    return <LockedGameView game={game} initialCount={initialCount} />;
  }
  if (game.runtimeStatus === "hidden") {
    notFound();
  }

  const tournaments = getTournamentsByGameSlug(game.slug);
  const ranking = getRankingByGameSlug(game.slug).slice(0, 10);
  const isLocked = game.status === "visible_locked";
  const openCount = tournaments.filter((tournament) => tournament.status === "open").length;
  const liveCount = tournaments.filter((tournament) => tournament.status === "live").length;
  const nextTournament = tournaments
    .filter((tournament) => tournament.status !== "finished")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  const nextDateFmt = nextTournament ? formatStageDate(nextTournament.startDate) : "—";

  const seasonPlan = nextTournament
    ? [
        {
          label: "Inscrições abertas",
          detail: `${nextTournament.registered}/${nextTournament.maxPlayers} confirmados`,
          tone: "primary" as const
        },
        {
          label: "Check-in e bracket",
          detail: `${formatStageDate(nextTournament.startDate)} às 19h`,
          tone: "accent" as const
        },
        {
          label: "Pódio e premiação",
          detail: nextTournament.prize,
          tone: "gold" as const
        }
      ]
    : [
        {
          label: "Hub pronto",
          detail: "estrutura ativa para a próxima agenda",
          tone: "primary" as const
        },
        {
          label: "Fila de interesse",
          detail: isLocked ? "avise que quer entrar na abertura" : "acompanhe a próxima publicação",
          tone: "accent" as const
        },
        {
          label: "Hall da fama",
          detail: `${game.champions.length} nomes já passaram por aqui`,
          tone: "gold" as const
        }
      ];

  return (
    <div className="flex flex-col gap-12 pb-20 md:gap-16 md:pb-24">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={game.heroImage} alt="" fill priority sizes="100vw" className="object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-ppb-background/35 via-ppb-background/78 to-ppb-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-ppb-background via-ppb-background/60 to-transparent" />
          <div
            className="absolute -left-32 top-1/3 h-96 w-96 rounded-full blur-[140px]"
            style={{ backgroundColor: `${game.themeColor}45` }}
          />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-ppb-accent/15 blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pb-24 md:pt-8">
          <Link
            href="/jogos"
            className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-xs font-semibold text-ppb-muted backdrop-blur transition hover:border-ppb-primary/40 hover:bg-ppb-surface hover:text-ppb-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Todos os jogos
          </Link>

          <div className="mt-10 grid gap-8 md:mt-16 lg:grid-cols-[1.04fr,0.96fr]">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={isLocked ? "soon" : "open"}>
                  {isLocked ? "Em breve" : "Modalidade ativa"}
                </StatusBadge>
                {liveCount > 0 ? <StatusBadge tone="live">{liveCount} ao vivo</StatusBadge> : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted backdrop-blur">
                  <Gamepad2 className="h-3 w-3 text-ppb-primary" />
                  Hub oficial
                </span>
              </div>

              <h1 className="max-w-4xl font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
                {game.name}
              </h1>

              <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                {game.heroSubtitle || game.shortDescription}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeroChip
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Campeonatos"
                  value={`${tournaments.length} publicados`}
                />
                <HeroChip
                  icon={<Flame className="h-4 w-4" />}
                  label="Ao vivo"
                  value={liveCount > 0 ? `${liveCount} disputa agora` : "aguardando próximas lives"}
                />
                <HeroChip
                  icon={<Crown className="h-4 w-4" />}
                  label="Hall da fama"
                  value={game.champions[0] ? `${game.champions[0].name} em destaque` : "seu nome pode ser o próximo"}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {isLocked ? (
                  <ButtonLink href="/suporte" size="lg" className="shadow-ppb-glow-strong">
                    Avisar quando abrir
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </ButtonLink>
                ) : openCount > 0 && nextTournament ? (
                  <ButtonLink
                    href={`/campeonatos/${nextTournament.id}/inscricao`}
                    size="lg"
                    className="shadow-ppb-glow-strong"
                  >
                    Participar de campeonato
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/campeonatos" size="lg" className="shadow-ppb-glow-strong">
                    Ver campeonatos
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </ButtonLink>
                )}
                <ButtonLink href="#ranking" variant="secondary" size="lg">
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Ver ranking
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                    Agenda da modalidade
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
                    Ritmo competitivo
                  </h2>
                </div>
                <div className="rounded-full border border-ppb-border bg-ppb-surface/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted">
                  {nextDateFmt}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {seasonPlan.map((item, index) => (
                  <SeasonStep
                    key={item.label}
                    index={index + 1}
                    label={item.label}
                    detail={item.detail}
                    tone={item.tone}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-ppb-border bg-ppb-surface/70 p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-accent">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Próxima janela
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MiniInfo label="Data" value={nextDateFmt} />
                  <MiniInfo
                    label="Status"
                    value={openCount > 0 ? `${openCount} abertas` : isLocked ? "modo espera" : "nova agenda em breve"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-6 grid w-full max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:-mt-12 md:px-6 lg:grid-cols-5">
        <IconInfoCard
          tone="accent"
          icon={<Gamepad2 className="h-5 w-5" />}
          label="Status"
          value={isLocked ? "Em breve" : "Ativo"}
        />
        <IconInfoCard
          tone="primary"
          icon={<Sparkles className="h-5 w-5" />}
          label="Campeonatos"
          value={tournaments.length}
          hint={openCount > 0 ? `${openCount} abertos` : "Nenhum aberto"}
        />
        <IconInfoCard
          tone="primary"
          icon={<Users className="h-5 w-5" />}
          label="No ranking"
          value={ranking.length}
          hint="jogadores"
        />
        <IconInfoCard
          tone="accent"
          icon={<Calendar className="h-5 w-5" />}
          label="Próximo evento"
          value={nextDateFmt}
        />
        <IconInfoCard
          highlight
          icon={<Trophy className="h-5 w-5" />}
          label="Hall da fama"
          value={game.champions.length}
          hint={game.champions.length > 0 ? "campeões" : "Em aberto"}
        />
      </section>

      {game.gallery.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <GameGallery
            images={game.gallery}
            subtitle={`Atmosfera ${game.name}`}
            title="Galeria do jogo"
          />
        </section>
      ) : null}

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-ppb-border bg-ppb-surface/80 p-6 shadow-ppb-card md:p-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
            <Swords className="mr-1 inline h-3 w-3" />
            Como essa modalidade joga
          </div>
          <h2 className="mt-1 font-display text-3xl font-black uppercase text-white md:text-4xl">
            Um hub para entrar, competir e voltar
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ppb-muted">
            Aqui a experiência precisa ser simples: encontrar campeonato, entender formato,
            acompanhar ranking e ver quem está dominando o meta da modalidade sem atrito.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="h-4 w-4" />}
              title="Entrada rápida"
              description="inscrição clara, premiação visível e CTA forte logo no início"
            />
            <FeatureCard
              icon={<Users className="h-4 w-4" />}
              title="Comunidade viva"
              description="jogadores, fila competitiva e retorno constante para acompanhar o topo"
            />
            <FeatureCard
              icon={<Trophy className="h-4 w-4" />}
              title="Prestígio real"
              description="ranking, hall da fama e prova de consistência para quem quer crescer"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-ppb-border bg-ppb-surface/80 p-6 shadow-ppb-card md:p-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
            <Crown className="mr-1 inline h-3 w-3" />
            Sinais da modalidade
          </div>
          <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
            Leitura rápida
          </h2>

          <div className="mt-5 space-y-3">
            <SignalRow label="Próximo foco" value={nextTournament?.name ?? "Aguardando próxima publicação"} />
            <SignalRow label="Top do ranking" value={ranking[0]?.nick ?? "Ainda sem líder"} />
            <SignalRow label="Competidores" value={`${ranking.length} nomes já ranqueados`} />
            <SignalRow label="Campeões" value={`${game.champions.length} entradas no hall da fama`} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              <Sparkles className="mr-1 inline h-3 w-3" />
              Disponíveis agora
            </div>
            <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl">
              Campeonatos
            </h2>
          </div>
          <Link
            href="/campeonatos"
            className="hidden items-center gap-1 rounded-full border border-ppb-border bg-ppb-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text sm:inline-flex"
          >
            Todos os campeonatos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {tournaments.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                data={toCardData(tournament, game.coverImage, game.name)}
              />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-12 text-center">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ppb-primary/10 blur-3xl" />
            <Lock className="mx-auto h-10 w-10 text-ppb-mutedSoft" />
            <h3 className="mt-4 font-display text-xl font-black uppercase text-ppb-text">
              Nenhum campeonato ativo
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ppb-muted">
              {isLocked
                ? "A modalidade está visível, mas as inscrições serão abertas em breve. Fique de olho."
                : "Volte logo para conferir os próximos torneios desta modalidade."}
            </p>
            {isLocked ? (
              <ButtonLink href="/suporte" variant="secondary" className="mt-5">
                <MessageCircle className="mr-2 h-4 w-4" />
                Quero ser avisado
              </ButtonLink>
            ) : null}
          </div>
        )}
      </section>

      <section id="ranking" className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
          <div className="flex items-center justify-between gap-4 border-b border-ppb-border px-6 py-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                Ranking
              </div>
              <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
                Top {ranking.length} {game.name}
              </h2>
            </div>
            <Link
              href="/ranking"
              className="inline-flex items-center gap-1 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
            >
              Geral
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {ranking.length > 0 ? (
            <>
              <div className="grid grid-cols-[44px,1fr,80px,60px] gap-3 border-b border-ppb-border px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft sm:grid-cols-[44px,1fr,120px,80px,60px]">
                <span>Pos</span>
                <span>Jogador</span>
                <span className="hidden sm:block">Cidade</span>
                <span className="text-right">Pts</span>
                <span className="text-right">Vit</span>
              </div>
              <ul className="divide-y divide-ppb-border">
                {ranking.map((entry) => {
                  const isTop = entry.pos <= 3;
                  const topBg =
                    entry.pos === 1
                      ? "bg-gradient-to-r from-ppb-gold/15 to-transparent ring-ppb-gold/30"
                      : entry.pos === 2
                        ? "bg-gradient-to-r from-white/10 to-transparent ring-white/20"
                        : entry.pos === 3
                          ? "bg-gradient-to-r from-amber-700/10 to-transparent ring-amber-700/30"
                          : "";

                  return (
                    <li
                      key={entry.pos}
                      className={cn(
                        "grid grid-cols-[44px,1fr,80px,60px] items-center gap-3 px-6 py-3 transition-colors hover:bg-ppb-subtle/40 sm:grid-cols-[44px,1fr,120px,80px,60px]",
                        isTop && "ring-1 ring-inset",
                        isTop && topBg
                      )}
                    >
                      <span
                        className={cn(
                          "font-display text-base font-black",
                          entry.pos === 1
                            ? "text-ppb-gold"
                            : entry.pos === 2
                              ? "text-white"
                              : entry.pos === 3
                                ? "text-amber-500"
                                : "text-ppb-muted"
                        )}
                      >
                        #{entry.pos}
                      </span>
                      <span className="flex min-w-0 items-center gap-3">
                        <PlayerAvatar
                          nick={entry.nick}
                          position={isTop ? (entry.pos as 1 | 2 | 3) : undefined}
                          size="md"
                        />
                        <span className="truncate font-bold text-ppb-text">{entry.nick}</span>
                      </span>
                      <span className="hidden truncate text-xs text-ppb-muted sm:block">
                        {entry.city} · {entry.uf}
                      </span>
                      <span className="text-right font-display text-base font-black text-ppb-text">
                        {entry.pts.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-right text-sm font-bold text-ppb-muted">{entry.wins}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
              <p className="mt-3 text-sm text-ppb-muted">Ranking ainda não publicado para esta modalidade.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Regulamento
          </div>
          <h3 className="mt-1 font-display text-2xl font-black uppercase text-white">Regras da modalidade</h3>
          <ul className="mt-5 space-y-3">
            {game.rules.map((rule, index) => (
              <li
                key={rule}
                className="flex gap-3 rounded-2xl border border-ppb-border bg-ppb-subtle/60 p-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ppb-primary/15 font-display text-xs font-black text-ppb-primary ring-1 ring-ppb-primary/30">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-ppb-text/90">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {game.champions.length > 0 ? (
        <section className="border-y border-ppb-border bg-ppb-subtle/30">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="mb-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                <Crown className="mr-1 inline h-3 w-3" />
                Hall da fama
              </div>
              <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl">
                Campeões anteriores
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {game.champions.map((champion, index) => (
                <ChampionCard
                  key={`${champion.season}-${champion.name}`}
                  name={champion.name}
                  title={champion.season}
                  image={game.gallery[(index + 1) % game.gallery.length] ?? game.heroImage}
                  prize={champion.title}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primary/15 via-ppb-surface to-ppb-surface p-8 shadow-ppb-glow md:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-ppb-primary/25 blur-[100px]" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-ppb-accent/15 blur-[100px]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
            <div className="space-y-4">
              <StatusBadge tone={isLocked ? "soon" : "open"}>
                {isLocked ? "Inscrições em breve" : "Inscrições abertas"}
              </StatusBadge>
              <h2 className="font-display text-3xl font-black uppercase leading-[0.9] tracking-[-0.02em] text-white sm:text-4xl md:text-5xl">
                {isLocked ? `${game.name} está chegando.` : `Pronto pra entrar no ${game.name}?`}
              </h2>
              <p className="max-w-xl text-base leading-7 text-ppb-muted">
                {isLocked
                  ? "A modalidade já tem estrutura pronta. Quando abrir, você vai querer estar lá no primeiro evento."
                  : "Escolha um campeonato, monte seu time e dispute prêmios reais."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              {isLocked ? (
                <ButtonLink href="/suporte" size="lg" className="w-full justify-center shadow-ppb-glow-strong">
                  Me avise quando abrir
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              ) : nextTournament ? (
                <ButtonLink
                  href={`/campeonatos/${nextTournament.id}/inscricao`}
                  size="lg"
                  className="w-full justify-center shadow-ppb-glow-strong"
                >
                  Entrar no próximo campeonato
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              ) : (
                <ButtonLink href="/campeonatos" size="lg" className="w-full justify-center shadow-ppb-glow-strong">
                  Ver todos os campeonatos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              )}
              <ButtonLink href="/ranking" variant="secondary" size="lg" className="w-full justify-center">
                <ListOrdered className="mr-2 h-4 w-4" />
                Ver ranking geral
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroChip({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function SeasonStep({
  index,
  label,
  detail,
  tone
}: {
  index: number;
  label: string;
  detail: string;
  tone: "primary" | "accent" | "gold";
}) {
  const styles = {
    primary: "border-ppb-primary/25 bg-ppb-primary/10 text-ppb-primary",
    accent: "border-ppb-accent/25 bg-ppb-accent/10 text-ppb-accent",
    gold: "border-ppb-gold/25 bg-ppb-gold/10 text-ppb-gold"
  }[tone];

  return (
    <div className="grid grid-cols-[auto,1fr] items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-surface/60 px-4 py-3">
      <div className={cn("grid h-10 w-10 place-items-center rounded-2xl border text-sm font-black", styles)}>
        {index}
      </div>
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-ppb-muted">{detail}</div>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/45 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-mutedSoft">{label}</div>
      <div className="mt-2 font-display text-xl font-black text-white">{value}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/45 p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-sm leading-6 text-ppb-muted">{description}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/45 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-mutedSoft">{label}</div>
      <div className="mt-2 text-sm font-bold text-white">{value}</div>
    </div>
  );
}
