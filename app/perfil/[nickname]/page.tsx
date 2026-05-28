"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Edit3,
  ExternalLink,
  Flame,
  Gamepad2,
  Layers,
  ListOrdered,
  Medal,
  Monitor,
  ShieldAlert,
  Sparkles,
  Swords,
  Target,
  Trophy,
  TrendingUp,
  Tv,
  User,
  Video,
  Camera,
  X
} from "lucide-react";

const TwitchIcon = Tv;
const YoutubeIcon = Video;
const InstagramIcon = Camera;
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconInfoCard } from "@/components/ui/icon-info-card";
import { TournamentCard, type TournamentCardData } from "@/components/ui/tournament-card";
import {
  ProfileSidebar,
  ProfileNavTabs,
  type ProfileNavItem
} from "@/components/profile/profile-sidebar";
import {
  AchievementBadge,
  type Achievement
} from "@/components/profile/achievement-badge";
import { MyBetsSection } from "@/components/profile/my-bets-section";
import { getPlayerHistory, type PlayerHistoryEntry } from "@/lib/player-history";
import { isOwnerOfProfile, readArenaProfile } from "@/lib/profile-storage";
import { getAllTournaments, getTournamentById } from "@/lib/mock-tournaments";
import { getGameBySlug } from "@/lib/games";
import { readTournamentRegistrations } from "@/lib/tournament-registration";

type Props = { params: Promise<{ nickname: string }> };

type PlayerMatch = {
  id: string;
  tournamentId: string;
  roundLabel: string;
  status: "tbd" | "pending" | "result_submitted" | "disputed" | "finalized" | "bye";
  playerA: { nickname: string; teamName?: string } | null;
  playerB: { nickname: string; teamName?: string } | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: "A" | "B" | null;
  updatedAt: string;
};

type MatchStatsApi = {
  total: number;
  wins: number;
  losses: number;
  titles: number;
  winRate: number;
  pending: number;
};

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(".", "");
}

function classifyEntry(entry: PlayerHistoryEntry) {
  const blob = `${entry.resultLabel} ${entry.campaignLabel}`.toLowerCase();
  if (/camp(eão|eao)/.test(blob)) return "title";
  if (/eliminado|derrota|perdeu/.test(blob)) return "loss";
  if (/venceu|classificad|segue vivo|avancou/.test(blob)) return "win";
  if (/ao vivo|aguardando|em andamento|inscri/.test(blob)) return "pending";
  return "pending";
}

export default function PerfilPage({ params }: Props) {
  const { nickname } = use(params);
  const decoded = decodeURIComponent(nickname);

  const [history, setHistory] = useState<PlayerHistoryEntry[]>([]);
  const [profile, setProfile] = useState<ReturnType<typeof readArenaProfile> | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [upcomingTournaments, setUpcomingTournaments] = useState<TournamentCardData[]>([]);
  const [playerMatches, setPlayerMatches] = useState<PlayerMatch[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStatsApi>({
    total: 0,
    wins: 0,
    losses: 0,
    titles: 0,
    winRate: 0,
    pending: 0
  });

  useEffect(() => {
    setHistory(getPlayerHistory(decoded));
    setIsOwner(isOwnerOfProfile(decoded));
    // Só carrega o profile local se for o dono — visitante não vê dados pessoais
    setProfile(isOwnerOfProfile(decoded) ? readArenaProfile() : null);

    // Próximos campeonatos = inscrições do jogador que ainda não terminaram
    const regs = readTournamentRegistrations().filter(
      (r) => r.nickname.trim().toLowerCase() === decoded.trim().toLowerCase()
    );
    const cards: TournamentCardData[] = [];
    for (const r of regs) {
      const t = getTournamentById(r.tournamentId);
      if (!t || t.status === "finished") continue;
      const game = getGameBySlug(t.gameSlug);
      cards.push({
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
      });
    }
    cards.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setUpcomingTournaments(cards);

    // Fetch matches do jogador via API server (sistema real de matches)
    fetch(`/api/players/${encodeURIComponent(decoded)}/matches`)
      .then((r) => r.json())
      .then((data) => {
        setPlayerMatches(data.matches ?? []);
        setMatchStats(data.stats ?? { total: 0, wins: 0, losses: 0, titles: 0, winRate: 0, pending: 0 });
      })
      .catch(() => {
        setPlayerMatches([]);
      });
  }, [decoded]);

  const stats = useMemo(() => {
    // Sistema real de matches tem prioridade. Se vazio, cai pro histórico mock.
    if (matchStats.total > 0) {
      return matchStats;
    }
    const total = history.length;
    const wins = history.filter((e) => classifyEntry(e) === "win" || classifyEntry(e) === "title").length;
    const losses = history.filter((e) => classifyEntry(e) === "loss").length;
    const titles = history.filter((e) => classifyEntry(e) === "title").length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { total, wins, losses, titles, winRate, pending: 0 };
  }, [history, matchStats]);

  const pendingMatches = useMemo(
    () =>
      playerMatches.filter((m) => m.status === "pending" || m.status === "result_submitted" || m.status === "disputed"),
    [playerMatches]
  );

  const finalizedMatches = useMemo(
    () => playerMatches.filter((m) => m.status === "finalized"),
    [playerMatches]
  );

  const achievements: Achievement[] = useMemo(
    () => [
      {
        id: "first-tournament",
        title: "Primeira batalha",
        description: "Participe do seu primeiro campeonato.",
        icon: Swords,
        unlocked: stats.total >= 1,
        tone: "primary"
      },
      {
        id: "first-win",
        title: "Primeira vitória",
        description: "Vença sua primeira partida ranqueada.",
        icon: Target,
        unlocked: stats.wins >= 1,
        tone: "primary"
      },
      {
        id: "veteran",
        title: "Veterano",
        description: "Acumule 10 partidas no histórico.",
        icon: Activity,
        unlocked: stats.total >= 10,
        tone: "accent"
      },
      {
        id: "champion",
        title: "Campeão",
        description: "Erga seu primeiro troféu na plataforma.",
        icon: Trophy,
        unlocked: stats.titles >= 1,
        tone: "gold"
      },
      {
        id: "hot-streak",
        title: "Em chamas",
        description: "Mantenha 70% de win rate em 5+ partidas.",
        icon: Flame,
        unlocked: stats.total >= 5 && stats.winRate >= 70,
        tone: "gold"
      },
      {
        id: "loyal",
        title: "Fiel ao game",
        description: "Acumule 3 títulos na plataforma.",
        icon: Crown,
        unlocked: stats.titles >= 3,
        tone: "gold"
      }
    ],
    [stats]
  );

  const navItems: ProfileNavItem[] = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: <TrendingUp className="h-4 w-4" /> },
      {
        id: "partidas",
        label: "Minhas partidas",
        icon: <Swords className="h-4 w-4" />,
        count: pendingMatches.length
      },
      {
        id: "campeonatos",
        label: "Meus campeonatos",
        icon: <Gamepad2 className="h-4 w-4" />,
        count: upcomingTournaments.length
      },
      {
        id: "historico",
        label: "Histórico",
        icon: <ListOrdered className="h-4 w-4" />,
        count: finalizedMatches.length || history.length
      },
      {
        id: "conquistas",
        label: "Conquistas",
        icon: <Award className="h-4 w-4" />,
        count: achievements.filter((a) => a.unlocked).length
      },
      // Apostas só fazem sentido pra dona/dono do perfil
      ...(isOwner
        ? [{ id: "apostas", label: "Minhas apostas", icon: <Coins className="h-4 w-4" /> }]
        : []),
      { id: "perfil", label: "Perfil", icon: <User className="h-4 w-4" /> }
    ],
    [upcomingTournaments.length, history.length, achievements, pendingMatches.length, finalizedMatches.length, isOwner]
  );

  const platformLabel = profile?.platform || "PC";
  const fullName = profile?.fullName || "";

  return (
    <div className="flex flex-col gap-10 pb-24 md:gap-12">
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

        <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 md:px-6 md:pb-14 md:pt-14">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
            <PlayerAvatar nick={decoded} size="lg" className="!h-24 !w-24 [&>div:first-child]:!h-24 [&>div:first-child]:!w-24 [&>div:first-child]:!text-4xl" />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="open">Online</StatusBadge>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted backdrop-blur">
                  <Monitor className="h-3 w-3 text-ppb-primary" />
                  {platformLabel}
                </span>
                {stats.titles > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-gold/40 bg-ppb-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-gold backdrop-blur">
                    <Crown className="h-3 w-3" />
                    {stats.titles}x campeão
                  </span>
                ) : null}
                {isOwner ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-accent/40 bg-ppb-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-accent backdrop-blur">
                    <Sparkles className="h-3 w-3" />
                    Seu perfil
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.02em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl">
                {decoded}
              </h1>
              {isOwner && fullName ? (
                <p className="mt-1 text-sm text-ppb-muted">{fullName}</p>
              ) : null}

              {/* SOCIAL LINKS — dados sensíveis só pro dono, redes públicas pra todos */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {profile?.twitch ? (
                  <SocialLink href={`https://twitch.tv/${profile.twitch}`} icon={<TwitchIcon className="h-3.5 w-3.5" />}>
                    {profile.twitch}
                  </SocialLink>
                ) : null}
                {isOwner ? (
                  <Link
                    href="/perfil/editar"
                    className="inline-flex items-center gap-1.5 rounded-full border border-ppb-primary/40 bg-ppb-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-primary backdrop-blur transition hover:bg-ppb-primary/25"
                  >
                    <Edit3 className="h-3 w-3" />
                    Editar perfil
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="hidden flex-col items-end gap-2 md:flex">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-mutedSoft">
                Win rate
              </div>
              <div className="font-display text-6xl font-black text-ppb-primary drop-shadow-[0_0_24px_rgba(255,106,0,0.4)]">
                {stats.winRate}%
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <IconInfoCard tone="primary" icon={<Swords className="h-5 w-5" />} label="Partidas" value={stats.total} />
            <IconInfoCard tone="accent" icon={<Target className="h-5 w-5" />} label="Vitórias" value={stats.wins} />
            <IconInfoCard tone="primary" icon={<X className="h-5 w-5" />} label="Derrotas" value={stats.losses} />
            <IconInfoCard highlight icon={<Trophy className="h-5 w-5" />} label="Títulos" value={stats.titles} hint={stats.titles > 0 ? "campeão!" : "sem títulos"} />
          </div>
        </div>
      </section>

      {/* ─────────────── NAV MOBILE ─────────────── */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:hidden">
        <ProfileNavTabs items={navItems} />
      </div>

      {/* ─────────────── BODY ─────────────── */}
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[260px,1fr]">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ProfileSidebar items={navItems} />
          </div>
        </aside>

        <div className="space-y-12">
          {/* ─────────────── DASHBOARD ─────────────── */}
          <section id="dashboard" className="scroll-mt-24 space-y-5">
            <SectionHeader
              eyebrow="Visão geral"
              title="Dashboard"
              icon={<TrendingUp className="h-5 w-5" />}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard
                tone="primary"
                icon={<Calendar className="h-5 w-5" />}
                label="Próximo evento"
                main={upcomingTournaments[0] ? upcomingTournaments[0].name : "Sem campeonato"}
                hint={
                  upcomingTournaments[0]
                    ? new Date(upcomingTournaments[0].date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short"
                      })
                    : "Inscreva-se em um"
                }
              />
              <KpiCard
                tone="accent"
                icon={<Activity className="h-5 w-5" />}
                label="Última partida"
                main={history[0]?.tournamentName ?? "Nenhuma"}
                hint={history[0] ? formatDateTime(history[0].playedAt) : "Sem registros"}
              />
              <KpiCard
                tone="gold"
                icon={<Sparkles className="h-5 w-5" />}
                label="Conquistas"
                main={`${achievements.filter((a) => a.unlocked).length} / ${achievements.length}`}
                hint="medalhas desbloqueadas"
              />
            </div>
          </section>

          {/* ─────────────── MINHAS PARTIDAS ─────────────── */}
          <section id="partidas" className="scroll-mt-24 space-y-5">
            <SectionHeader
              eyebrow={pendingMatches.length > 0 ? "Aguardando você" : "Suas partidas"}
              title="Minhas partidas"
              icon={<Swords className="h-5 w-5" />}
              right={
                pendingMatches.length > 0 ? (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40">
                    {pendingMatches.length} pendente{pendingMatches.length === 1 ? "" : "s"}
                  </span>
                ) : null
              }
            />

            {pendingMatches.length === 0 ? (
              <EmptyState
                icon={<Swords className="h-8 w-8" />}
                title="Sem partidas no momento"
                description="Quando o admin gerar o bracket do campeonato, suas partidas aparecem aqui."
              />
            ) : (
              <div className="space-y-3">
                {pendingMatches.map((m) => (
                  <PlayerMatchCard key={m.id} match={m} myNickname={decoded} />
                ))}
              </div>
            )}
          </section>

          {/* ─────────────── MEUS CAMPEONATOS ─────────────── */}
          <section id="campeonatos" className="scroll-mt-24 space-y-5">
            <SectionHeader
              eyebrow="Inscrito em"
              title="Meus campeonatos"
              icon={<Gamepad2 className="h-5 w-5" />}
            />

            {upcomingTournaments.length === 0 ? (
              <EmptyState
                icon={<Gamepad2 className="h-8 w-8" />}
                title="Você ainda não tem inscrição"
                description="Quando você se inscrever em um campeonato, ele aparece aqui com a data e o status."
                ctaLabel="Ver campeonatos abertos"
                ctaHref="/campeonatos"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingTournaments.map((t) => (
                  <TournamentCard key={t.id} data={t} />
                ))}
              </div>
            )}
          </section>

          {/* ─────────────── HISTÓRICO ─────────────── */}
          <section id="historico" className="scroll-mt-24 space-y-5">
            <SectionHeader
              eyebrow="Carreira"
              title="Histórico de partidas"
              icon={<ListOrdered className="h-5 w-5" />}
            />

            {/* Matches finalizadas do sistema real (chaveamento) */}
            {finalizedMatches.length > 0 ? (
              <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
                <ul className="divide-y divide-ppb-border">
                  {finalizedMatches.map((m) => (
                    <FinalizedMatchRow key={m.id} match={m} myNickname={decoded} />
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Histórico antigo (mocks/inscrições) */}
            {history.length > 0 ? (
              <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
                <ul className="divide-y divide-ppb-border">
                  {history.map((entry) => (
                    <HistoryRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              </div>
            ) : null}

            {finalizedMatches.length === 0 && history.length === 0 ? (
              <EmptyState
                icon={<ListOrdered className="h-8 w-8" />}
                title="Nenhuma partida registrada"
                description="Quando você jogar um campeonato, o resultado aparece aqui."
              />
            ) : null}
          </section>

          {/* ─────────────── CONQUISTAS ─────────────── */}
          <section id="conquistas" className="scroll-mt-24 space-y-5">
            <SectionHeader
              eyebrow="Medalhas"
              title="Conquistas"
              icon={<Award className="h-5 w-5" />}
              right={
                <span className="rounded-full bg-ppb-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-gold ring-1 ring-ppb-gold/40">
                  {achievements.filter((a) => a.unlocked).length} / {achievements.length}
                </span>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </div>
          </section>

          {/* ─────────────── MINHAS APOSTAS (só dono) ─────────────── */}
          {isOwner ? (
            <section id="apostas" className="scroll-mt-24 space-y-5">
              <SectionHeader
                eyebrow="PPC em jogo"
                title="Minhas apostas"
                icon={<Coins className="h-5 w-5" />}
              />
              <MyBetsSection />
            </section>
          ) : null}

          {/* ─────────────── PERFIL ─────────────── */}
          <section id="perfil" className="scroll-mt-24 space-y-5">
            <SectionHeader eyebrow="Identidade" title="Perfil" icon={<User className="h-5 w-5" />} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-black uppercase text-ppb-text">
                  Dados do jogador
                  {!isOwner ? (
                    <span className="rounded-full bg-ppb-subtle px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-muted ring-1 ring-ppb-border">
                      Público
                    </span>
                  ) : null}
                </h3>
                <div className="mt-4 space-y-3">
                  <InfoRow label="Gamertag" value={decoded} />
                  <InfoRow label="Plataforma" value={platformLabel} />
                  {isOwner ? (
                    <>
                      <InfoRow label="Nome completo" value={fullName || "—"} />
                      <InfoRow label="E-mail" value={profile?.email || "—"} />
                      <InfoRow label="WhatsApp" value={profile?.whatsapp || "—"} />
                    </>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl bg-ppb-subtle/40 px-3 py-2.5 text-xs text-ppb-muted">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-ppb-mutedSoft" />
                      <span>
                        Nome, e-mail e WhatsApp são privados do jogador. Faça login com este perfil pra ver.
                      </span>
                    </div>
                  )}
                </div>
                {isOwner ? (
                  <Link
                    href="/perfil/editar"
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ppb-primary hover:text-ppb-primaryHover"
                  >
                    Editar perfil completo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>

              <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
                <h3 className="font-display text-lg font-black uppercase text-ppb-text">
                  Redes sociais
                </h3>
                <div className="mt-4 space-y-3">
                  <SocialRow icon={<TwitchIcon className="h-4 w-4" />} label="Twitch" value={profile?.twitch || "—"} />
                  <SocialRow icon={<YoutubeIcon className="h-4 w-4" />} label="YouTube" value="—" />
                  <SocialRow icon={<InstagramIcon className="h-4 w-4" />} label="Instagram" value="—" />
                </div>
                <p className="mt-5 text-xs text-ppb-muted">
                  Conecte suas redes pra ganhar destaque em transmissões oficiais.
                </p>
              </div>
            </div>
          </section>

          {/* CTA FINAL */}
          <section className="rounded-3xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primary/15 via-ppb-surface to-ppb-surface p-6 shadow-ppb-glow md:p-8">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  Próximo passo
                </div>
                <h3 className="mt-1 font-display text-2xl font-black uppercase text-white md:text-3xl">
                  Pronto pra próxima vitória?
                </h3>
                <p className="mt-1 text-sm text-ppb-muted">
                  Escolha um campeonato aberto e dispute prêmios reais.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/campeonatos" size="lg" className="shadow-ppb-glow-strong">
                  Ver campeonatos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/ranking" variant="secondary" size="lg">
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Ranking
                </ButtonLink>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  icon,
  right
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
          {eyebrow}
        </div>
        <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
          <span className="text-ppb-primary">{icon}</span>
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

function KpiCard({
  tone,
  icon,
  label,
  main,
  hint
}: {
  tone: "primary" | "accent" | "gold";
  icon: React.ReactNode;
  label: string;
  main: string;
  hint?: string;
}) {
  const toneClass = {
    primary: "border-ppb-primary/30 from-ppb-primary/10",
    accent: "border-ppb-accent/30 from-ppb-accent/10",
    gold: "border-ppb-gold/30 from-ppb-gold/10"
  }[tone];
  const iconClass = {
    primary: "bg-ppb-primary/15 text-ppb-primary ring-ppb-primary/40",
    accent: "bg-ppb-accent/15 text-ppb-accent ring-ppb-accent/40",
    gold: "bg-ppb-gold/15 text-ppb-gold ring-ppb-gold/40"
  }[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br via-ppb-surface to-ppb-surface p-5",
        toneClass
      )}
    >
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-current opacity-10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className={cn("grid h-9 w-9 place-items-center rounded-xl ring-1", iconClass)}>
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft">
            {label}
          </span>
        </div>
        <div className="mt-3 truncate font-display text-xl font-black text-ppb-text">{main}</div>
        {hint ? <div className="mt-1 truncate text-xs text-ppb-muted">{hint}</div> : null}
      </div>
    </div>
  );
}

function PlayerMatchCard({ match, myNickname }: { match: PlayerMatch; myNickname: string }) {
  const isA = match.playerA?.nickname.toLowerCase() === myNickname.trim().toLowerCase();
  const me = isA ? match.playerA : match.playerB;
  const opponent = isA ? match.playerB : match.playerA;
  const mySubmitted = match.status === "result_submitted";

  const STATUS_STYLE = {
    pending: {
      Icon: Sparkles,
      label: "Pronta pra jogar",
      ring: "border-emerald-500/40 bg-emerald-500/5",
      badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
    },
    result_submitted: {
      Icon: Clock,
      label: "Aguardando confirmação",
      ring: "border-amber-500/40 bg-amber-500/5",
      badge: "bg-amber-500/15 text-amber-300 ring-amber-500/40"
    },
    disputed: {
      Icon: ShieldAlert,
      label: "Em disputa",
      ring: "border-rose-500/40 bg-rose-500/5",
      badge: "bg-rose-500/15 text-rose-300 ring-rose-500/40"
    },
    finalized: { Icon: CheckCircle2, label: "Finalizada", ring: "", badge: "" },
    bye: { Icon: CheckCircle2, label: "BYE", ring: "", badge: "" },
    tbd: { Icon: Clock, label: "A definir", ring: "", badge: "" }
  } as const;
  const style = STATUS_STYLE[match.status];
  const Icon = style.Icon;

  return (
    <Link
      href={`/partidas/${match.id}`}
      className={cn(
        "block rounded-2xl border p-4 transition-all hover:-translate-y-0.5",
        style.ring || "border-ppb-border bg-ppb-surface"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1", style.badge)}>
            <Icon className="h-3 w-3" />
            {style.label}
          </span>
          <span className="rounded-full bg-ppb-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-primary ring-1 ring-ppb-primary/40">
            {match.roundLabel}
          </span>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-ppb-muted" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <PlayerAvatar nick={me?.nickname ?? "?"} size="sm" />
          <span className="truncate text-sm font-bold text-ppb-text">{me?.teamName || me?.nickname}</span>
        </div>
        <span className="font-display text-xs text-ppb-mutedSoft">VS</span>
        <div className="flex flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-bold text-ppb-text">{opponent?.teamName || opponent?.nickname || "A definir"}</span>
          {opponent ? <PlayerAvatar nick={opponent.nickname} size="sm" /> : null}
        </div>
      </div>
      {match.status === "pending" || mySubmitted ? (
        <div className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
          → {match.status === "pending" ? "Clique pra enviar o resultado" : "Toque pra ver e responder"}
        </div>
      ) : null}
    </Link>
  );
}

function FinalizedMatchRow({ match, myNickname }: { match: PlayerMatch; myNickname: string }) {
  const isA = match.playerA?.nickname.toLowerCase() === myNickname.trim().toLowerCase();
  const myScore = isA ? match.scoreA : match.scoreB;
  const opScore = isA ? match.scoreB : match.scoreA;
  const opponent = isA ? match.playerB : match.playerA;
  const won = (isA && match.winner === "A") || (!isA && match.winner === "B");

  return (
    <Link
      href={`/partidas/${match.id}`}
      className="grid grid-cols-[auto,1fr,auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-ppb-subtle/40"
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
          won
            ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
            : "bg-rose-500/10 text-rose-300 ring-rose-500/30"
        )}
      >
        {won ? <Trophy className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <div className="truncate font-bold text-ppb-text">
          {match.roundLabel} · <span className="text-ppb-muted">vs {opponent?.nickname ?? "—"}</span>
        </div>
        <div className="font-display text-base font-black text-ppb-text">
          {myScore ?? "—"} <span className="text-ppb-mutedSoft">x</span> {opScore ?? "—"}
        </div>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1",
          won ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40" : "bg-rose-500/10 text-rose-300 ring-rose-500/30"
        )}
      >
        {won ? "Venceu" : "Perdeu"}
      </span>
    </Link>
  );
}

function HistoryRow({ entry }: { entry: PlayerHistoryEntry }) {
  const kind = classifyEntry(entry);
  const style = {
    title: { Icon: Crown, color: "text-ppb-gold", bg: "bg-ppb-gold/15 ring-ppb-gold/40", label: "Título" },
    win: { Icon: Trophy, color: "text-emerald-300", bg: "bg-emerald-500/15 ring-emerald-500/40", label: "Vitória" },
    loss: { Icon: X, color: "text-rose-300", bg: "bg-rose-500/15 ring-rose-500/40", label: "Derrota" },
    pending: { Icon: Clock, color: "text-ppb-accent", bg: "bg-ppb-accent/15 ring-ppb-accent/40", label: "Aguardando" }
  }[kind];
  const Icon = style.Icon;

  return (
    <li className="grid grid-cols-[auto,1fr,auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-ppb-subtle/40 sm:grid-cols-[auto,1fr,140px,auto]">
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1", style.bg)}>
        <Icon className={cn("h-5 w-5", style.color)} />
      </div>
      <div className="min-w-0">
        <div className="truncate font-bold text-ppb-text">{entry.tournamentName}</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
          <span>{entry.roundLabel}</span>
          <span className="text-ppb-muted">·</span>
          <span>{entry.resultLabel}</span>
        </div>
      </div>
      <div className="hidden text-right text-xs text-ppb-muted sm:block">
        {formatDateTime(entry.playedAt)}
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1",
          style.bg,
          style.color
        )}
      >
        {style.label}
      </span>
    </li>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ppb-border bg-ppb-subtle/40 px-3 py-2.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">{label}</span>
      <span className="truncate text-sm font-bold text-ppb-text">{value}</span>
    </div>
  );
}

function SocialRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const isEmpty = value === "—";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ppb-border bg-ppb-subtle/40 px-3 py-2.5">
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-lg ring-1",
          isEmpty
            ? "bg-ppb-subtle text-ppb-mutedSoft ring-ppb-border"
            : "bg-ppb-primary/15 text-ppb-primary ring-ppb-primary/40"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">{label}</div>
        <div className={cn("truncate text-sm font-bold", isEmpty ? "text-ppb-muted" : "text-ppb-text")}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SocialLink({
  href,
  icon,
  children
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
    >
      <span className="text-ppb-primary">{icon}</span>
      {children}
    </a>
  );
}

function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-10 text-center">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ppb-primary/10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ppb-subtle text-ppb-mutedSoft ring-1 ring-ppb-border">
          {icon}
        </div>
        <h3 className="mt-4 font-display text-xl font-black uppercase text-ppb-text">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ppb-muted">{description}</p>
        {ctaLabel && ctaHref ? (
          <ButtonLink href={ctaHref} variant="secondary" className="mt-5">
            {ctaLabel}
            <ChevronRight className="ml-1 h-4 w-4" />
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
