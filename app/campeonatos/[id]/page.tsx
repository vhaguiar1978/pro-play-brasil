"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Gamepad2,
  Info,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  MapPin,
  Monitor,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { IconInfoCard } from "@/components/ui/icon-info-card";
import { PrizeBadge } from "@/components/ui/prize-badge";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { PodiumCard, type PodiumEntry } from "@/components/ui/podium-card";
import { ChampionCard } from "@/components/ui/champion-card";
import { GameGallery } from "@/components/ui/game-gallery";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { TournamentParticipants } from "@/components/tournament-participants";
import { TournamentStructure } from "@/components/tournament-structure";
import { LiveStreamsBoard } from "@/components/live/live-streams-board";
import { BracketView } from "@/components/matches/bracket-view";
import { getGameBySlug } from "@/lib/games";
import { getMockStructure } from "@/lib/mock-structure";
import { getRankingByGameSlug } from "@/lib/mock-rankings";
import { formatLabel, getTournamentById, type MockTournament } from "@/lib/mock-tournaments";

type Props = { params: Promise<{ id: string }> };

const STATUS_TONE: Record<MockTournament["status"], StatusTone> = {
  open: "open",
  live: "live",
  finished: "finished"
};

function buildPodium(prize: string): PodiumEntry[] {
  const isPpc = /PPC/i.test(prize);
  const match = prize.match(/(?:R\$|PPC)?\s*([\d.,]+)/);
  const raw = match?.[1];
  if (!raw) {
    return [{ position: 1, prize, hint: "Premiação principal" }];
  }
  const total = parseFloat(raw.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(total) || total <= 0) {
    return [{ position: 1, prize, hint: "Premiação principal" }];
  }
  const fmt = (n: number) => {
    if (isPpc) return `${Math.round(n)} PPC`;
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: total >= 100 ? 0 : 2
    });
  };
  return [
    { position: 1, prize: fmt(total * 0.6), hint: "Campeão" },
    { position: 2, prize: fmt(total * 0.25), hint: "Vice-campeão" },
    { position: 3, prize: fmt(total * 0.15), hint: "3º colocado" }
  ];
}

export default function CampeonatoPage({ params }: Props) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<MockTournament | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Tenta primeiro no mock/localStorage (sync)
    const local = getTournamentById(id);
    if (local) {
      setTournament(local);
      setLoaded(true);
      return;
    }
    // Senão busca no server (campeonatos criados pelo admin)
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.tournaments ?? []) as MockTournament[];
        setTournament(list.find((t) => t.id === id));
      })
      .catch(() => setTournament(undefined))
      .finally(() => setLoaded(true));
  }, [id]);

  if (!loaded) return null;
  if (!tournament) notFound();

  const game = getGameBySlug(tournament.gameSlug);
  const structure = getMockStructure(tournament.format, tournament.id, tournament.maxPlayers);
  const ranking = getRankingByGameSlug(tournament.gameSlug);
  const date = new Date(tournament.startDate);
  const heroImage = game?.heroImage ?? game?.coverImage;
  const isOpen = tournament.status === "open";
  const isLive = tournament.status === "live";
  const fillPct = Math.min(100, (tournament.registered / tournament.maxPlayers) * 100);
  const vagasRestantes = Math.max(0, tournament.maxPlayers - tournament.registered);
  const podium = buildPodium(tournament.prize);
  const champions = game?.champions ?? [];

  const dataFmt = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  const dataLongFmt = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const horaFmt = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const rulesItems: AccordionItem[] = [
    {
      id: "formato",
      icon: <Layers className="h-4 w-4" />,
      title: "Formato e estrutura",
      content: (
        <div className="space-y-2">
          <p>Modalidade: <strong className="text-ppb-text">{formatLabel(tournament.format)}</strong>.</p>
          <p>Plataforma oficial: <strong className="text-ppb-text">{tournament.platform}</strong>.</p>
          {tournament.minimumPlayers ? (
            <p>Mínimo de <strong className="text-ppb-text">{tournament.minimumPlayers}</strong> jogadores confirmados por time.</p>
          ) : null}
        </div>
      )
    },
    {
      id: "check-in",
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: "Check-in e participação",
      content: (
        <ul className="space-y-2">
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Check-in obrigatório 15 min antes do horário oficial.</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Capitão confirma elenco e plataforma antes do início.</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Lineup travada após o fechamento das inscrições.</li>
        </ul>
      )
    },
    {
      id: "resultados",
      icon: <ShieldCheck className="h-4 w-4" />,
      title: "Resultados e fair play",
      content: (
        <ul className="space-y-2">
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Resultado enviado com print sempre que solicitado.</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Conflitos passam por revisão administrativa.</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Fair play é obrigatório — qualquer violação resulta em punição.</li>
        </ul>
      )
    },
    {
      id: "premiacao-regra",
      icon: <Trophy className="h-4 w-4" />,
      title: "Sobre a premiação",
      content: (
        <p>
          A premiação total de <strong className="text-ppb-text">{tournament.prize}</strong> é distribuída entre os três primeiros colocados conforme o card de premiação. Pagamento liberado após validação dos resultados finais pela administração.
        </p>
      )
    }
  ];

  const tabItems: TabItem[] = [
    {
      id: "sobre",
      label: "Sobre",
      icon: <Info className="h-4 w-4" />,
      content: (
        <div className="space-y-5">
          {tournament.description ? (
            <div className="relative isolate overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
              {/* Keyart de fundo */}
              {heroImage ? (
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <Image
                    src={heroImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover opacity-15 mix-blend-luminosity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-ppb-surface via-ppb-surface/80 to-ppb-surface/30" />
                </div>
              ) : null}
              <div className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-ppb-primary/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
                    <Info className="h-4 w-4" />
                  </span>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
                    Sobre o campeonato
                  </div>
                </div>
                <p className="mt-4 text-base leading-7 text-ppb-text/90">
                  {tournament.description}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetaPill icon={<Layers className="h-3.5 w-3.5" />} label="Formato">
                    {formatLabel(tournament.format)}
                  </MetaPill>
                  <MetaPill icon={<Monitor className="h-3.5 w-3.5" />} label="Plataforma">
                    {tournament.platform}
                  </MetaPill>
                  <MetaPill icon={<MapPin className="h-3.5 w-3.5" />} label="Região">
                    {tournament.regionLabel}
                  </MetaPill>
                  <MetaPill icon={<Calendar className="h-3.5 w-3.5" />} label="Data oficial">
                    {dataLongFmt}
                  </MetaPill>
                  <MetaPill icon={<Clock className="h-3.5 w-3.5" />} label="Horário">
                    {horaFmt}
                  </MetaPill>
                  <MetaPill icon={<Coins className="h-3.5 w-3.5" />} label="Inscrição">
                    {tournament.feeLabel ?? "Grátis"}
                  </MetaPill>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )
    },
    {
      id: "regras",
      label: "Regras",
      icon: <ShieldCheck className="h-4 w-4" />,
      content: <Accordion items={rulesItems} defaultOpenId="formato" />
    },
    {
      id: "tabela",
      label: "Tabela",
      icon: <Layers className="h-4 w-4" />,
      content: <BracketView tournamentId={tournament.id} />
    },
    {
      id: "ranking",
      label: "Ranking",
      icon: <ListOrdered className="h-4 w-4" />,
      badge: ranking.length || undefined,
      content: <RankingTable entries={ranking} gameName={game?.name ?? tournament.gameSlug} />
    },
    {
      id: "transmissao",
      label: "Transmissão",
      icon: <Radio className="h-4 w-4" />,
      content: <BroadcastBlock isLive={isLive} heroImage={heroImage} tournamentName={tournament.name} />
    },
    {
      id: "participantes",
      label: "Participantes",
      icon: <Users className="h-4 w-4" />,
      badge: tournament.registered,
      content: (
        <TournamentParticipants
          tournamentId={tournament.id}
          baseParticipants={tournament.participants}
        />
      )
    }
  ];

  return (
    <div className="relative flex flex-col gap-10 pb-32 md:gap-14 md:pb-20">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {heroImage ? (
            <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover scale-105" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-ppb-background/40 via-ppb-background/80 to-ppb-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-ppb-background via-ppb-background/60 to-transparent" />
          <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[120px]" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-ppb-accent/15 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pb-24 md:pt-8">
          <Link
            href="/campeonatos"
            className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-xs font-semibold text-ppb-muted backdrop-blur transition hover:border-ppb-primary/40 hover:bg-ppb-surface hover:text-ppb-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Campeonatos
          </Link>

          <div className="mt-10 flex flex-col gap-5 md:mt-16">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_TONE[tournament.status]} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted backdrop-blur">
                <Sparkles className="h-3 w-3 text-ppb-primary" />
                {tournament.origin === "official" ? "Oficial Pro Play" : "Comunidade"}
              </span>
              {game ? (
                <Link
                  href={`/jogos/${game.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
                >
                  <Gamepad2 className="h-3 w-3" />
                  {game.name}
                </Link>
              ) : null}
            </div>

            <h1 className="max-w-4xl font-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.02em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-5xl md:text-7xl">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <PrizeBadge prize={tournament.prize} size="lg" />
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ppb-muted">
                <Calendar className="h-4 w-4 text-ppb-primary" />
                {dataFmt} · {horaFmt}
              </span>
            </div>

            <div className="hidden flex-wrap gap-3 pt-3 md:flex">
              {isOpen ? (
                <ButtonLink href={`/campeonatos/${tournament.id}/inscricao`} size="lg" className="shadow-ppb-glow-strong">
                  Participar agora
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-2xl border border-ppb-border bg-ppb-surface/60 px-6 py-3 text-sm font-bold text-ppb-muted backdrop-blur">
                  <ShieldCheck className="h-4 w-4" />
                  {isLive ? "Inscrições encerradas — em andamento" : "Campeonato finalizado"}
                </span>
              )}
              {isLive ? (
                <ButtonLink href="#tabs" variant="secondary" size="lg">
                  <Radio className="mr-2 h-4 w-4 text-emerald-400" />
                  Assistir ao vivo
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* CARDS DE INFO COM ÍCONES */}
      <section className="mx-auto -mt-6 grid w-full max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:-mt-12 md:px-6 lg:grid-cols-6">
        <IconInfoCard tone="accent" icon={<Gamepad2 className="h-5 w-5" />} label="Jogo" value={game?.name ?? tournament.gameSlug} />
        <IconInfoCard tone="primary" icon={<Calendar className="h-5 w-5" />} label="Data" value={dataFmt} />
        <IconInfoCard tone="primary" icon={<Clock className="h-5 w-5" />} label="Horário" value={horaFmt} />
        <IconInfoCard tone="accent" icon={<Coins className="h-5 w-5" />} label="Inscrição" value={tournament.feeLabel ?? "Grátis"} />
        <IconInfoCard tone="primary" icon={<Users className="h-5 w-5" />} label="Vagas" value={`${tournament.registered}/${tournament.maxPlayers}`} hint={vagasRestantes > 0 ? `${vagasRestantes} restantes` : "Lotado"} />
        <IconInfoCard icon={<Trophy className="h-5 w-5" />} label="Prêmio" value={tournament.prize} highlight />
      </section>

      {/* GALERIA DO JOGO */}
      {game?.gallery && game.gallery.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <GameGallery
            images={game.gallery}
            subtitle={`Atmosfera ${game.name}`}
            title="Galeria do jogo"
          />
        </section>
      ) : null}

      {/* AO VIVO DO MESMO JOGO (só aparece quando tem) */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <LiveStreamsBoard gameSlug={tournament.gameSlug} limit={3} />
      </section>

      {/* CORPO PRINCIPAL — TABS + SIDEBAR */}
      <section id="tabs" className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div>
          <Tabs items={tabItems} defaultId="sobre" />
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* INSCRIÇÃO */}
          <div className="relative overflow-hidden rounded-3xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primary/20 via-ppb-surface to-ppb-surface p-6 shadow-ppb-glow">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ppb-primary/30 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                <Sparkles className="h-3 w-3" />
                {isOpen ? "Garantir vaga" : isLive ? "Em andamento" : "Encerrado"}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-4xl font-black text-white">
                  {tournament.feeLabel ?? "Grátis"}
                </span>
                <span className="text-xs font-semibold text-ppb-muted">inscrição</span>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold">
                <span className="text-ppb-muted">Vagas preenchidas</span>
                <span className="text-ppb-text">{tournament.registered}/{tournament.maxPlayers}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ppb-subtle ring-1 ring-ppb-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-ppb-primary to-ppb-primaryHover shadow-[0_0_12px_rgba(255,106,0,0.6)] transition-all duration-700"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              {isOpen ? (
                <ButtonLink
                  href={`/campeonatos/${tournament.id}/inscricao`}
                  className="mt-6 w-full shadow-ppb-glow-strong"
                  size="lg"
                >
                  Participar agora
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              ) : (
                <div className="mt-6 rounded-2xl border border-ppb-border bg-ppb-subtle p-4 text-center text-sm font-bold uppercase tracking-wider text-ppb-muted">
                  {isLive ? "Em andamento" : "Encerrado"}
                </div>
              )}
            </div>
          </div>

          {/* PREMIAÇÃO 1º / 2º / 3º */}
          <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ppb-text">
              <Crown className="h-4 w-4 text-ppb-gold" />
              Premiação
            </h3>
            <p className="mt-1 text-xs text-ppb-muted">
              Total: <span className="font-bold text-ppb-text">{tournament.prize}</span>
            </p>
            <div className="mt-4">
              <PodiumCard entries={podium} />
            </div>
          </div>

          {/* ÚLTIMOS CAMPEÕES */}
          {champions.length > 0 ? (
            <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ppb-text">
                <Trophy className="h-4 w-4 text-ppb-gold" />
                Últimos campeões {game?.name ? `· ${game.name}` : ""}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {champions.slice(0, 2).map((c, i) => (
                  <ChampionCard
                    key={`${c.season}-${c.name}`}
                    name={c.name}
                    title={c.season}
                    image={game?.gallery?.[i + 1] ?? game?.gallery?.[i] ?? game?.heroImage}
                    prize={c.title}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      {/* CTA FIXO MOBILE */}
      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ppb-border bg-ppb-background/95 px-4 py-3 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">Inscrição</div>
              <div className="truncate font-display text-lg font-black text-ppb-text">
                {tournament.feeLabel ?? "Grátis"}
              </div>
            </div>
            <ButtonLink
              href={`/campeonatos/${tournament.id}/inscricao`}
              size="lg"
              className="shadow-ppb-glow-strong"
            >
              Participar
              <ArrowRight className="ml-1 h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetaPill({
  label,
  icon,
  children
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/60 px-3 py-2.5">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-ppb-text">{children}</div>
    </div>
  );
}

function RankingTable({
  entries,
  gameName
}: {
  entries: { pos: number; nick: string; pts: number; wins: number; city: string; uf: string }[];
  gameName: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-10 text-center">
        <Users className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
        <p className="mt-3 text-sm text-ppb-muted">Ranking ainda não foi publicado para esta modalidade.</p>
      </div>
    );
  }

  const TOP_STYLES: Record<number, string> = {
    1: "bg-gradient-to-r from-ppb-gold/15 via-ppb-surface to-ppb-surface ring-ppb-gold/30 text-ppb-gold",
    2: "bg-gradient-to-r from-white/10 via-ppb-surface to-ppb-surface ring-white/20 text-white",
    3: "bg-gradient-to-r from-amber-700/10 via-ppb-surface to-ppb-surface ring-amber-700/30 text-amber-500"
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
      <div className="flex items-center justify-between border-b border-ppb-border px-6 py-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">Ranking</div>
          <h3 className="font-display text-lg font-black uppercase tracking-wider text-ppb-text">{gameName}</h3>
        </div>
        <span className="text-xs font-semibold text-ppb-muted">{entries.length} jogadores</span>
      </div>
      <div className="grid grid-cols-[44px,1fr,80px,60px] gap-3 border-b border-ppb-border px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft sm:grid-cols-[44px,1fr,120px,80px,60px]">
        <span>Pos</span>
        <span>Jogador</span>
        <span className="hidden sm:block">Cidade</span>
        <span className="text-right">Pts</span>
        <span className="text-right">Vit</span>
      </div>
      <ul className="divide-y divide-ppb-border">
        {entries.map((e) => {
          const isTop = e.pos <= 3;
          const topStyle = TOP_STYLES[e.pos];
          return (
            <li
              key={e.pos}
              className={cn(
                "grid grid-cols-[44px,1fr,80px,60px] items-center gap-3 px-6 py-3 transition-colors hover:bg-ppb-subtle/40 sm:grid-cols-[44px,1fr,120px,80px,60px]",
                isTop && "ring-1 ring-inset",
                isTop && topStyle
              )}
            >
              <span className={cn("font-display text-base font-black", isTop ? "" : "text-ppb-muted")}>
                #{e.pos}
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <PlayerAvatar nick={e.nick} position={e.pos <= 3 ? (e.pos as 1 | 2 | 3) : undefined} size="md" />
                <span className="truncate font-bold text-ppb-text">{e.nick}</span>
              </span>
              <span className="hidden truncate text-xs text-ppb-muted sm:block">
                {e.city} · {e.uf}
              </span>
              <span className="text-right font-display text-base font-black text-ppb-text">{e.pts.toLocaleString("pt-BR")}</span>
              <span className="text-right text-sm font-bold text-ppb-muted">{e.wins}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BroadcastBlock({
  isLive,
  heroImage,
  tournamentName
}: {
  isLive: boolean;
  heroImage?: string;
  tournamentName: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-6 shadow-ppb-card md:p-8",
        isLive ? "border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-ppb-surface to-ppb-surface" : "border-ppb-border bg-ppb-surface"
      )}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          {isLive ? (
            <StatusBadge tone="live">AO VIVO</StatusBadge>
          ) : (
            <StatusBadge tone="soon">Em breve</StatusBadge>
          )}
          <Radio className={cn("h-5 w-5", isLive ? "animate-pulse text-emerald-300" : "text-ppb-mutedSoft")} />
        </div>

        <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl border border-ppb-border bg-ppb-background/60">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={tournamentName}
              width={1280}
              height={720}
              className={cn("h-full w-full object-cover", isLive ? "opacity-80" : "opacity-50")}
            />
          ) : null}
          {/* Overlay neon */}
          <div className="absolute inset-0 bg-gradient-to-br from-ppb-background/40 via-transparent to-ppb-background/40" />
          {/* Botão Play centralizado */}
          <button
            type="button"
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-20 w-20 place-items-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95",
              isLive
                ? "bg-emerald-400 text-ppb-background shadow-[0_0_40px_rgba(52,211,153,0.6)]"
                : "bg-white/90 text-ppb-background shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            )}
          >
            <Play className="h-8 w-8 fill-current" />
          </button>
          {/* Badge AO VIVO no canto */}
          {isLive ? (
            <div className="absolute left-3 top-3">
              <StatusBadge tone="live" size="sm">AO VIVO</StatusBadge>
            </div>
          ) : null}
          {/* Watermark do jogo */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-ppb-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            <ImageIcon className="h-3 w-3 text-ppb-primary" />
            {tournamentName}
          </div>
        </div>

        <p className="mt-4 text-sm text-ppb-muted">
          {isLive
            ? "A transmissão oficial está rolando agora. Acompanhe a partida em tempo real."
            : "A transmissão será liberada quando o campeonato iniciar. Volte aqui no horário do evento."}
        </p>
      </div>
    </div>
  );
}

