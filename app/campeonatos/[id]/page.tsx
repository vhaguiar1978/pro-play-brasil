"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
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
  Layers,
  ListOrdered,
  MapPin,
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
import { LiveStreamsBoard } from "@/components/live/live-streams-board";
import { BracketView } from "@/components/matches/bracket-view";
import { getGameBySlug } from "@/lib/games";
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

function buildAgenda(dateLabel: string, timeLabel: string, isLive: boolean) {
  return [
    {
      time: "18:00",
      title: "Check-in e lineup",
      copy: "Capitão confirma elenco e presença antes da rodada principal.",
      status: "Pré-jogo"
    },
    {
      time: timeLabel,
      title: isLive ? "Rodada em andamento" : "Início oficial",
      copy: `Evento programado para ${dateLabel}, com destaque para transmissão, tabela e acompanhamento em tempo real.`,
      status: isLive ? "Ao vivo" : "Hoje"
    },
    {
      time: "23:59",
      title: "Resultado e revisão",
      copy: "Janela de envio de resultado e contestação com revisão administrativa se necessário.",
      status: "Pendente"
    }
  ] as const;
}

export default function CampeonatoPage({ params }: Props) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<MockTournament | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const local = getTournamentById(id);
    if (local) {
      setTournament(local);
      setLoaded(true);
      return;
    }
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
  const agenda = buildAgenda(dataLongFmt, horaFmt, isLive);

  const rulesItems: AccordionItem[] = [
    {
      id: "formato",
      icon: <Layers className="h-4 w-4" />,
      title: "Formato e estrutura",
      content: (
        <div className="space-y-2">
          <p>Modalidade: <strong className="text-white">{formatLabel(tournament.format)}</strong>.</p>
          <p>Plataforma oficial: <strong className="text-white">{tournament.platform}</strong>.</p>
          {tournament.minimumPlayers ? (
            <p>Mínimo de <strong className="text-white">{tournament.minimumPlayers}</strong> jogadores confirmados por time.</p>
          ) : null}
        </div>
      )
    },
    {
      id: "checkin",
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
      id: "resultado",
      icon: <ShieldCheck className="h-4 w-4" />,
      title: "Resultados e fair play",
      content: (
        <ul className="space-y-2">
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Resultado enviado com prova quando solicitado.</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Conflitos passam por revisão administrativa.</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-ppb-primary" /> Fair play é obrigatório e qualquer violação pode gerar punição.</li>
        </ul>
      )
    }
  ];

  const tabItems: TabItem[] = [
    {
      id: "visao-geral",
      label: "Visão geral",
      icon: <Sparkles className="h-4 w-4" />,
      content: (
        <div className="grid gap-5">
          {tournament.description ? (
            <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:p-8">
              {heroImage ? (
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <Image src={heroImage} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover opacity-10" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0d1420] via-[#0d1420]/88 to-[#0d1420]/40" />
                </div>
              ) : null}
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
                  Sobre o evento
                </div>
                <p className="max-w-3xl text-base leading-8 text-white/84">{tournament.description}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetaPill icon={<Layers className="h-3.5 w-3.5" />} label="Formato">{formatLabel(tournament.format)}</MetaPill>
                  <MetaPill icon={<Gamepad2 className="h-3.5 w-3.5" />} label="Plataforma">{tournament.platform}</MetaPill>
                  <MetaPill icon={<MapPin className="h-3.5 w-3.5" />} label="Região">{tournament.regionLabel}</MetaPill>
                  <MetaPill icon={<Calendar className="h-3.5 w-3.5" />} label="Data">{dataLongFmt}</MetaPill>
                  <MetaPill icon={<Clock className="h-3.5 w-3.5" />} label="Horário">{horaFmt}</MetaPill>
                  <MetaPill icon={<Coins className="h-3.5 w-3.5" />} label="Entrada">{tournament.feeLabel ?? "Grátis"}</MetaPill>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Agenda do campeonato</div>
                <h3 className="mt-2 font-display text-2xl font-black uppercase text-white">O que acontece hoje</h3>
              </div>
              <StatusBadge tone={isLive ? "live" : "open"}>{isLive ? "Ao vivo" : "Preparação"}</StatusBadge>
            </div>
            <div className="mt-4 grid gap-3">
              {agenda.map((item, index) => (
                <div key={item.title} className={cn("grid gap-3 rounded-2xl border p-4 md:grid-cols-[92px,1fr,auto]", index === 0 ? "border-ppb-primary/35 bg-ppb-primary/10" : "border-white/10 bg-white/[0.04]")}>
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
        </div>
      )
    },
    {
      id: "estrutura",
      label: "Estrutura",
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
      content: <TournamentParticipants tournamentId={tournament.id} baseParticipants={tournament.participants} />
    },
    {
      id: "regras",
      label: "Regras",
      icon: <ShieldCheck className="h-4 w-4" />,
      content: <Accordion items={rulesItems} defaultOpenId="formato" />
    }
  ];

  return (
    <div className="relative flex flex-col gap-10 pb-32 text-white md:gap-14 md:pb-20">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          {heroImage ? <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover scale-105" /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070c]/35 via-[#05070c]/80 to-[#05070c]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070c] via-[#05070c]/60 to-transparent" />
          <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[120px]" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pb-24 md:pt-8">
          <Link
            href="/campeonatos"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/64 backdrop-blur transition hover:border-ppb-primary/40 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Campeonatos
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={STATUS_TONE[tournament.status]} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur">
                  <Sparkles className="h-3 w-3 text-ppb-primary" />
                  {tournament.origin === "official" ? "Oficial Pro Play" : "Comunidade"}
                </span>
                {game ? (
                  <Link
                    href={`/jogos/${game.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur transition hover:border-ppb-primary/40 hover:text-white"
                  >
                    <Gamepad2 className="h-3 w-3" />
                    {game.name}
                  </Link>
                ) : null}
              </div>

              <h1 className="max-w-4xl font-display text-4xl font-black uppercase leading-[0.88] tracking-[-0.04em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-5xl md:text-7xl">
                {tournament.name}
              </h1>

              <p className="max-w-2xl text-sm leading-8 text-white/72 md:text-base">
                Página central do evento com agenda, premiação, vagas, transmissão, ranking e CTA sempre visível.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <PrizeBadge prize={tournament.prize} size="lg" />
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60">
                  <Calendar className="h-4 w-4 text-ppb-primary" />
                  {dataFmt} • {horaFmt}
                </span>
              </div>

              <div className="hidden flex-wrap gap-3 pt-3 md:flex">
                {isOpen ? (
                  <ButtonLink href={`/campeonatos/${tournament.id}/inscricao`} size="lg" className="shadow-ppb-glow-strong">
                    Participar agora
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </ButtonLink>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white/62 backdrop-blur">
                    <ShieldCheck className="h-4 w-4" />
                    {isLive ? "Inscrições encerradas — em andamento" : "Campeonato finalizado"}
                  </span>
                )}
                {isLive ? (
                  <ButtonLink href="#tabs" variant="secondary" size="lg" className="border-white/10 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/[0.1]">
                    <Radio className="mr-2 h-4 w-4 text-emerald-400" />
                    Assistir ao vivo
                  </ButtonLink>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)] backdrop-blur">
              <div className="grid gap-3 md:grid-cols-2">
                <HeroMetric label="Inscrição" value={tournament.feeLabel ?? "Grátis"} hint="entrada oficial" accent="orange" />
                <HeroMetric label="Vagas" value={`${tournament.registered}/${tournament.maxPlayers}`} hint={`${vagasRestantes} restantes`} accent="cyan" />
                <HeroMetric label="Formato" value={formatLabel(tournament.format)} hint="estrutura do evento" accent="gold" />
                <HeroMetric label="Região" value={tournament.regionLabel} hint="escopo do campeonato" accent="orange" />
              </div>

              <div className="mt-5 rounded-[1.6rem] border border-ppb-primary/25 bg-ppb-primary/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">Conversão</div>
                    <div className="mt-2 font-display text-4xl font-black uppercase text-white">{Math.round(fillPct)}%</div>
                  </div>
                  <StatusBadge tone={isOpen ? "open" : isLive ? "live" : "finished"}>
                    {isOpen ? "Aberto" : isLive ? "Ao vivo" : "Finalizado"}
                  </StatusBadge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#05070c] ring-1 ring-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-ppb-primary to-orange-400" style={{ width: `${fillPct}%` }} />
                </div>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Esta área resume rápido o que o usuário precisa saber antes de entrar: valor, ritmo de ocupação e status do evento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-6 grid w-full max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:-mt-12 md:px-6 lg:grid-cols-6">
        <IconInfoCard tone="accent" icon={<Gamepad2 className="h-5 w-5" />} label="Jogo" value={game?.name ?? tournament.gameSlug} className="border-white/10 bg-[#0d1420]" />
        <IconInfoCard tone="primary" icon={<Calendar className="h-5 w-5" />} label="Data" value={dataFmt} className="border-white/10 bg-[#0d1420]" />
        <IconInfoCard tone="primary" icon={<Clock className="h-5 w-5" />} label="Horário" value={horaFmt} className="border-white/10 bg-[#0d1420]" />
        <IconInfoCard tone="accent" icon={<Coins className="h-5 w-5" />} label="Entrada" value={tournament.feeLabel ?? "Grátis"} className="border-white/10 bg-[#0d1420]" />
        <IconInfoCard tone="primary" icon={<Users className="h-5 w-5" />} label="Vagas" value={`${tournament.registered}/${tournament.maxPlayers}`} hint={vagasRestantes > 0 ? `${vagasRestantes} restantes` : "Lotado"} className="border-white/10 bg-[#0d1420]" />
        <IconInfoCard icon={<Trophy className="h-5 w-5" />} label="Prêmio" value={tournament.prize} highlight className="border-white/10 bg-[#0d1420]" />
      </section>

      {game?.gallery && game.gallery.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <GameGallery images={game.gallery} subtitle={`Atmosfera ${game.name}`} title="Galeria do jogo" />
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <LiveStreamsBoard gameSlug={tournament.gameSlug} limit={3} />
      </section>

      <section id="tabs" className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1.12fr,0.88fr]">
        <div>
          <Tabs items={tabItems} defaultId="visao-geral" />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-3xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primary/18 via-[#0d1420] to-[#0d1420] p-6 shadow-ppb-glow">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ppb-primary/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                <Sparkles className="h-3 w-3" />
                {isOpen ? "Garantir vaga" : isLive ? "Em andamento" : "Encerrado"}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-4xl font-black text-white">{tournament.feeLabel ?? "Grátis"}</span>
                <span className="text-xs font-semibold text-white/54">inscrição</span>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold">
                <span className="text-white/54">Vagas preenchidas</span>
                <span className="text-white">{tournament.registered}/{tournament.maxPlayers}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#05070c] ring-1 ring-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-ppb-primary to-orange-400" style={{ width: `${fillPct}%` }} />
              </div>
              {isOpen ? (
                <ButtonLink href={`/campeonatos/${tournament.id}/inscricao`} className="mt-6 w-full shadow-ppb-glow-strong" size="lg">
                  Participar agora
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center text-sm font-bold uppercase tracking-wider text-white/62">
                  {isLive ? "Em andamento" : "Encerrado"}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1420] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Crown className="h-4 w-4 text-amber-300" />
              Premiação
            </h3>
            <p className="mt-1 text-xs text-white/54">
              Total: <span className="font-bold text-white">{tournament.prize}</span>
            </p>
            <div className="mt-4">
              <PodiumCard entries={podium} />
            </div>
          </div>

          {champions.length > 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0d1420] p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                <Trophy className="h-4 w-4 text-amber-300" />
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

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#05070c]/95 px-4 py-3 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/42">Inscrição</div>
              <div className="truncate font-display text-lg font-black text-white">{tournament.feeLabel ?? "Grátis"}</div>
            </div>
            <ButtonLink href={`/campeonatos/${tournament.id}/inscricao`} size="lg" className="shadow-ppb-glow-strong">
              Participar
              <ArrowRight className="ml-1 h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeroMetric({
  label,
  value,
  hint,
  accent
}: {
  label: string;
  value: string;
  hint: string;
  accent: "orange" | "cyan" | "gold";
}) {
  const accentClass = accent === "cyan" ? "text-cyan-300" : accent === "gold" ? "text-amber-300" : "text-ppb-primary";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">{label}</div>
      <div className={`mt-2 font-display text-3xl font-black uppercase ${accentClass}`}>{value}</div>
      <p className="mt-2 text-xs leading-6 text-white/56">{hint}</p>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/42">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-white">{children}</div>
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
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] p-10 text-center">
        <Users className="mx-auto h-8 w-8 text-white/30" />
        <p className="mt-3 text-sm text-white/58">Ranking ainda não foi publicado para esta modalidade.</p>
      </div>
    );
  }

  const TOP_STYLES: Record<number, string> = {
    1: "bg-gradient-to-r from-amber-300/12 via-[#0d1420] to-[#0d1420] ring-amber-300/25 text-amber-300",
    2: "bg-gradient-to-r from-white/10 via-[#0d1420] to-[#0d1420] ring-white/20 text-white",
    3: "bg-gradient-to-r from-orange-600/10 via-[#0d1420] to-[#0d1420] ring-orange-500/25 text-orange-400"
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1420] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">Ranking</div>
          <h3 className="font-display text-lg font-black uppercase tracking-wider text-white">{gameName}</h3>
        </div>
        <span className="text-xs font-semibold text-white/54">{entries.length} jogadores</span>
      </div>
      <div className="grid grid-cols-[44px,1fr,80px,60px] gap-3 border-b border-white/10 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/42 sm:grid-cols-[44px,1fr,120px,80px,60px]">
        <span>Pos</span>
        <span>Jogador</span>
        <span className="hidden sm:block">Cidade</span>
        <span className="text-right">Pts</span>
        <span className="text-right">Vit</span>
      </div>
      <ul className="divide-y divide-white/10">
        {entries.map((e) => {
          const isTop = e.pos <= 3;
          const topStyle = TOP_STYLES[e.pos];
          return (
            <li
              key={e.pos}
              className={cn(
                "grid grid-cols-[44px,1fr,80px,60px] items-center gap-3 px-6 py-3 transition-colors hover:bg-white/[0.04] sm:grid-cols-[44px,1fr,120px,80px,60px]",
                isTop && "ring-1 ring-inset",
                isTop && topStyle
              )}
            >
              <span className={cn("font-display text-base font-black", isTop ? "" : "text-white/54")}>#{e.pos}</span>
              <span className="flex min-w-0 items-center gap-3">
                <PlayerAvatar nick={e.nick} position={e.pos <= 3 ? (e.pos as 1 | 2 | 3) : undefined} size="md" />
                <span className="truncate font-bold text-white">{e.nick}</span>
              </span>
              <span className="hidden truncate text-xs text-white/54 sm:block">
                {e.city} • {e.uf}
              </span>
              <span className="text-right font-display text-base font-black text-white">{e.pts.toLocaleString("pt-BR")}</span>
              <span className="text-right text-sm font-bold text-white/58">{e.wins}</span>
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
    <div className={cn("relative overflow-hidden rounded-3xl border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:p-8", isLive ? "border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-[#0d1420] to-[#0d1420]" : "border-white/10 bg-[#0d1420]")}>
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          {isLive ? <StatusBadge tone="live">AO VIVO</StatusBadge> : <StatusBadge tone="soon">Em breve</StatusBadge>}
          <Radio className={cn("h-5 w-5", isLive ? "animate-pulse text-emerald-300" : "text-white/34")} />
        </div>

        <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {heroImage ? <Image src={heroImage} alt={tournamentName} width={1280} height={720} className={cn("h-full w-full object-cover", isLive ? "opacity-80" : "opacity-50")} /> : null}
          <div className="absolute inset-0 bg-gradient-to-br from-[#05070c]/40 via-transparent to-[#05070c]/50" />
          <div className={cn("absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-2xl", isLive ? "bg-emerald-400 text-[#05070c] shadow-[0_0_40px_rgba(52,211,153,0.6)]" : "bg-white/90 text-[#05070c] shadow-[0_0_30px_rgba(255,255,255,0.3)]")}>
            <Radio className="h-8 w-8 fill-current" />
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-white/58">
          {isLive ? "A transmissão oficial está rolando agora. Acompanhe a partida em tempo real." : "A transmissão será liberada quando o campeonato iniciar. Volte aqui no horário do evento."}
        </p>
      </div>
    </div>
  );
}
