"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Crown,
  Flame,
  Gamepad2,
  ListOrdered,
  Sparkles,
  Swords,
  Trophy,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RankingPodium } from "@/components/ranking/ranking-podium";
import { RankingTable } from "@/components/ranking/ranking-table";

type Row = {
  pos: number;
  nick: string;
  pts: number;
  wins: number;
  city: string;
  uf: string;
  gameSlug: string;
  gameName: string;
  gameImage?: string;
};

type TabDef = {
  id: "all" | string;
  label: string;
  image?: string;
  total: number;
};

type Props = {
  byGame: Array<{
    slug: string;
    name: string;
    coverImage: string;
    rows: Row[];
  }>;
};

const SEASON_STEPS = [
  { label: "Qualificatórias", status: "abertas" },
  { label: "Pódio semanal", status: "em destaque" },
  { label: "Final mensal", status: "premiação" }
];

export function RankingPageView({ byGame }: Props) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const allRows = useMemo(() => {
    const merged: Row[] = byGame.flatMap((game) =>
      game.rows.map((row) => ({
        ...row,
        gameSlug: game.slug,
        gameName: game.name,
        gameImage: game.coverImage
      }))
    );

    merged.sort((a, b) => b.pts - a.pts);
    return merged.map((row, index) => ({ ...row, pos: index + 1 }));
  }, [byGame]);

  const tabs: TabDef[] = useMemo(
    () => [
      { id: "all", label: "Geral", total: allRows.length },
      ...byGame.map((game) => ({
        id: game.slug,
        label: game.name,
        image: game.coverImage,
        total: game.rows.length
      }))
    ],
    [allRows.length, byGame]
  );

  const currentRows = useMemo(() => {
    if (activeTab === "all") return allRows;
    const game = byGame.find((item) => item.slug === activeTab);
    if (!game) return [];
    return game.rows.map((row) => ({
      ...row,
      gameSlug: game.slug,
      gameName: game.name,
      gameImage: game.coverImage
    }));
  }, [activeTab, allRows, byGame]);

  const podium = currentRows.slice(0, 3);
  const activeGame = activeTab === "all" ? null : byGame.find((game) => game.slug === activeTab) ?? null;
  const overallLeader = allRows[0];

  const spotlightGame = useMemo(() => {
    return byGame.reduce<
      | {
          slug: string;
          name: string;
          coverImage: string;
          rows: Row[];
          totalPoints: number;
        }
      | null
    >((best, game) => {
      const totalPoints = game.rows.reduce((sum, row) => sum + row.pts, 0);
      if (!best || totalPoints > best.totalPoints) {
        return { ...game, totalPoints };
      }
      return best;
    }, null);
  }, [byGame]);

  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,106,0,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(53,194,255,0.18),transparent_28%),linear-gradient(180deg,#070b12_0%,#0a111c_42%,#070b12_100%)]" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />

        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-10 pt-10 md:px-6 md:pb-14 md:pt-16 lg:grid-cols-[1.08fr,0.92fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-gold/30 bg-ppb-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold backdrop-blur">
              <Crown className="h-3 w-3" />
              Temporada competitiva
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
                Ranking que
                <br />
                <span className="text-ppb-gold">faz voltar</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                Acompanhe quem está dominando cada modalidade, descubra o ritmo da temporada
                e use o ranking como vitrine real para entrar nos campeonatos certos.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat
                icon={<Users className="h-5 w-5" />}
                label="Jogadores ranqueados"
                value={String(allRows.length)}
                hint="ativos na temporada"
                tone="primary"
              />
              <HeroStat
                icon={<Gamepad2 className="h-5 w-5" />}
                label="Modalidades"
                value={String(byGame.length)}
                hint="com ranking ao vivo"
                tone="accent"
              />
              <HeroStat
                icon={<Trophy className="h-5 w-5" />}
                label="Líder geral"
                value={overallLeader?.nick ?? "—"}
                hint={overallLeader ? `${overallLeader.pts.toLocaleString("pt-BR")} pts` : "aguardando"}
                tone="gold"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                  Corrida da temporada
                </div>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
                  Como subir
                </h2>
              </div>
              <div className="rounded-full border border-ppb-border bg-ppb-surface/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted">
                Atualização diária
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {SEASON_STEPS.map((step, index) => (
                <div
                  key={step.label}
                  className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-surface/60 px-4 py-3"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-ppb-primary/12 text-sm font-black text-ppb-primary ring-1 ring-ppb-primary/25">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{step.label}</div>
                    <div className="text-xs text-ppb-muted">{step.status}</div>
                  </div>
                  <Sparkles className="h-4 w-4 text-ppb-accent" />
                </div>
              ))}
            </div>

            {overallLeader ? (
              <div className="mt-5 rounded-2xl border border-ppb-gold/25 bg-gradient-to-br from-ppb-gold/12 via-ppb-surface to-ppb-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ppb-gold/15 text-ppb-gold ring-1 ring-ppb-gold/35">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                      Líder do momento
                    </div>
                    <div className="truncate font-display text-2xl font-black uppercase text-white">
                      {overallLeader.nick}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniMetric label="Pontos" value={overallLeader.pts.toLocaleString("pt-BR")} />
                  <MiniMetric label="Vitórias" value={String(overallLeader.wins)} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group inline-flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-3 transition-all duration-200",
                  active
                    ? "border-ppb-primary/60 bg-ppb-primary/15 shadow-ppb-glow"
                    : "border-ppb-border bg-ppb-surface/70 hover:border-ppb-borderStrong"
                )}
              >
                {tab.image ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-xl ring-1 ring-ppb-border">
                    <Image src={tab.image} alt="" fill sizes="32px" className="object-cover" />
                  </div>
                ) : (
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-xl ring-1 ring-ppb-border",
                      active ? "bg-ppb-primary text-white" : "bg-ppb-subtle text-ppb-primary"
                    )}
                  >
                    <Crown className="h-4 w-4" />
                  </span>
                )}
                <span
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider",
                    active ? "text-white" : "text-ppb-muted group-hover:text-ppb-text"
                  )}
                >
                  {tab.label}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    active ? "bg-white/20 text-white" : "bg-ppb-subtle text-ppb-muted ring-1 ring-ppb-border"
                  )}
                >
                  {tab.total}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          {podium.length > 0 ? (
            <div>
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                    <Sparkles className="mr-1 inline h-3 w-3" />
                    {activeTab === "all" ? "Pódio geral" : `Top 3 ${activeGame?.name ?? ""}`}
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
                    Destaque da semana
                  </h2>
                </div>
              </div>
              <RankingPodium entries={podium} />
            </div>
          ) : null}

          <div className="rounded-3xl border border-ppb-border bg-ppb-surface/80 p-5 shadow-ppb-card">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-ppb-primary" />
              <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
                Classificação completa
              </h2>
            </div>
            <p className="mt-2 text-sm text-ppb-muted">
              Ranking pensado para leitura rápida no mobile e comparação imediata entre os nomes que mais estão subindo.
            </p>
            <div className="mt-5">
              <RankingTable rows={currentRows} showGame={activeTab === "all"} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <aside className="rounded-3xl border border-ppb-border bg-ppb-surface/80 p-6 shadow-ppb-card">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-accent">
              <CalendarClock className="h-3.5 w-3.5" />
              Leitura da temporada
            </div>
            <h3 className="mt-2 font-display text-2xl font-black uppercase text-white">
              O que esse ranking diz
            </h3>

            <div className="mt-5 space-y-3">
              <InsightRow
                icon={<Flame className="h-4 w-4" />}
                label="Momento quente"
                value={
                  activeTab === "all"
                    ? spotlightGame?.name ?? "Sem dados"
                    : activeGame?.name ?? "Sem dados"
                }
              />
              <InsightRow
                icon={<Swords className="h-4 w-4" />}
                label="Mais vitórias"
                value={
                  currentRows[0]
                    ? `${currentRows[0].nick} · ${currentRows[0].wins} vitórias`
                    : "Sem partidas"
                }
              />
              <InsightRow
                icon={<Users className="h-4 w-4" />}
                label="Fila competitiva"
                value={`${currentRows.length} nomes nesta fila`}
              />
            </div>
          </aside>

          {spotlightGame ? (
            <aside className="relative overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
              <div className="relative aspect-[1.45/1]">
                <Image
                  src={spotlightGame.coverImage}
                  alt={spotlightGame.name}
                  fill
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ppb-background via-ppb-background/35 to-transparent" />
              </div>
              <div className="relative -mt-12 p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                  <Gamepad2 className="h-3 w-3" />
                  Modalidade em alta
                </div>
                <h3 className="mt-3 font-display text-3xl font-black uppercase text-white">
                  {spotlightGame.name}
                </h3>
                <p className="mt-2 text-sm text-ppb-muted">
                  A modalidade com maior volume competitivo no ranking atual. Ideal para quem quer entrar onde a comunidade está mais viva.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniMetric label="Pontos somados" value={spotlightGame.totalPoints.toLocaleString("pt-BR")} />
                  <MiniMetric label="Jogadores" value={String(spotlightGame.rows.length)} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab(spotlightGame.slug)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-ppb-primary px-5 py-3 text-sm font-bold text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover"
                  >
                    Ver este ranking
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/jogos/${spotlightGame.slug}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-ppb-border bg-ppb-subtle px-5 py-3 text-sm font-bold text-ppb-text transition hover:border-ppb-primary/40"
                  >
                    Abrir hub do jogo
                  </Link>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
  hint,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "accent" | "gold";
}) {
  const styles = {
    primary: "border-ppb-primary/20 bg-ppb-primary/8 text-ppb-primary",
    accent: "border-ppb-accent/20 bg-ppb-accent/8 text-ppb-accent",
    gold: "border-ppb-gold/20 bg-ppb-gold/8 text-ppb-gold"
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl border", styles)}>{icon}</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-mutedSoft">{label}</div>
      </div>
      <div className="mt-4 font-display text-2xl font-black uppercase text-white">{value}</div>
      <div className="mt-1 text-xs text-ppb-muted">{hint}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/45 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-mutedSoft">{label}</div>
      <div className="mt-2 font-display text-xl font-black text-white">{value}</div>
    </div>
  );
}

function InsightRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/45 px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-white">{value}</div>
    </div>
  );
}
