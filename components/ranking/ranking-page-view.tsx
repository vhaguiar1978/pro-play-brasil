"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Crown, Gamepad2, ListOrdered, Sparkles, TrendingUp, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconInfoCard } from "@/components/ui/icon-info-card";
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

export function RankingPageView({ byGame }: Props) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const allRows = useMemo(() => {
    const merged: Row[] = byGame.flatMap((g) =>
      g.rows.map((r) => ({ ...r, gameSlug: g.slug, gameName: g.name, gameImage: g.coverImage }))
    );
    merged.sort((a, b) => b.pts - a.pts);
    return merged.map((r, idx) => ({ ...r, pos: idx + 1 }));
  }, [byGame]);

  const tabs: TabDef[] = useMemo(
    () => [
      { id: "all", label: "Geral", total: allRows.length },
      ...byGame.map((g) => ({ id: g.slug, label: g.name, image: g.coverImage, total: g.rows.length }))
    ],
    [allRows.length, byGame]
  );

  const currentRows = useMemo(() => {
    if (activeTab === "all") return allRows;
    const game = byGame.find((g) => g.slug === activeTab);
    if (!game) return [];
    return game.rows.map((r) => ({
      ...r,
      gameSlug: game.slug,
      gameName: game.name,
      gameImage: game.coverImage
    }));
  }, [activeTab, allRows, byGame]);

  const podium = currentRows.slice(0, 3);
  const others = currentRows.slice(3);

  const champion = allRows[0];
  const topGame = useMemo(() => {
    let best = byGame[0];
    let bestPts = 0;
    for (const g of byGame) {
      const sum = g.rows.reduce((s, r) => s + r.pts, 0);
      if (sum > bestPts) {
        bestPts = sum;
        best = g;
      }
    }
    return best;
  }, [byGame]);

  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-ppb-background via-ppb-background to-ppb-background" />
          <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-ppb-gold/25 blur-[140px]" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-ppb-primary/20 blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-10 md:px-6 md:pb-14 md:pt-16">
          <div className="flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-gold/30 bg-ppb-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold backdrop-blur">
              <Crown className="h-3 w-3" />
              Ranking competitivo
            </div>
            <h1 className="max-w-4xl font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
              Top jogadores
              <br />
              <span className="text-ppb-gold">do Pro Play Brasil</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Ranking atualizado por modalidade. Use as abas pra ver o top do seu jogo favorito.
            </p>
          </div>

          {/* STATS */}
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <IconInfoCard
              icon={<Users className="h-5 w-5" />}
              label="Total no ranking"
              value={allRows.length}
              tone="primary"
            />
            <IconInfoCard
              icon={<Gamepad2 className="h-5 w-5" />}
              label="Modalidades"
              value={byGame.length}
              tone="accent"
            />
            <IconInfoCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Pontos somados"
              value={allRows.reduce((s, r) => s + r.pts, 0).toLocaleString("pt-BR")}
              tone="primary"
            />
            <IconInfoCard
              highlight
              icon={<Trophy className="h-5 w-5" />}
              label="Líder geral"
              value={champion?.nick ?? "—"}
              hint={champion ? `${champion.pts.toLocaleString("pt-BR")} pts` : ""}
            />
          </div>
        </div>
      </section>

      {/* ─────────────── TABS ─────────────── */}
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
                  "group inline-flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-all duration-200",
                  active
                    ? "border-ppb-primary/60 bg-ppb-primary/15 shadow-ppb-glow"
                    : "border-ppb-border bg-ppb-surface/60 hover:border-ppb-borderStrong"
                )}
              >
                {tab.image ? (
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-ppb-border">
                    <Image src={tab.image} alt="" fill sizes="28px" className="object-cover" />
                  </div>
                ) : (
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-lg ring-1 ring-ppb-border",
                      active ? "bg-ppb-primary text-white" : "bg-ppb-subtle text-ppb-primary"
                    )}
                  >
                    <Crown className="h-3.5 w-3.5" />
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
                    active
                      ? "bg-white/20 text-white"
                      : "bg-ppb-subtle text-ppb-muted ring-1 ring-ppb-border"
                  )}
                >
                  {tab.total}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────── PODIUM ─────────────── */}
      {podium.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Top 3 {activeTab === "all" ? "geral" : tabs.find((t) => t.id === activeTab)?.label}
              </div>
              <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
                O pódio
              </h2>
            </div>
          </div>
          <RankingPodium entries={podium} />
        </section>
      ) : null}

      {/* ─────────────── TABELA ─────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-5 flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-ppb-primary" />
          <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
            Classificação completa
          </h2>
        </div>
        <RankingTable rows={currentRows} showGame={activeTab === "all"} />
      </section>

      {/* ─────────────── DESTAQUE GAME ─────────────── */}
      {activeTab === "all" && topGame ? (
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
            <div className="relative grid gap-0 md:grid-cols-[40%,60%]">
              <div className="relative aspect-[3/4] md:aspect-auto">
                <Image
                  src={topGame.coverImage}
                  alt={topGame.name}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ppb-surface/30 to-ppb-surface md:bg-gradient-to-r" />
              </div>
              <div className="relative p-6 md:p-10">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                  <Crown className="mr-1 inline h-3 w-3" />
                  Modalidade em alta
                </div>
                <h3 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl">
                  {topGame.name}
                </h3>
                <p className="mt-3 max-w-md text-sm text-ppb-muted">
                  A modalidade com mais pontos somados pelos jogadores no ranking atual.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab(topGame.slug)}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ppb-primary px-5 py-3 text-sm font-bold text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover"
                >
                  Ver ranking de {topGame.name}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
