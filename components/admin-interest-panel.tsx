"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Crown,
  Download,
  Gamepad2,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Unlock,
  Users
} from "lucide-react";
import { GAMES } from "@/lib/games";
import { cn } from "@/lib/utils";

type FrozenStatus = "active" | "frozen" | "hidden";

type InterestClick = {
  id: string;
  gameSlug: string;
  nick: string;
  tag: string;
  createdAt: string;
};

type SuggestionBucket = {
  displayName: string;
  count: number;
  items: { id: string; nick: string; tag: string; createdAt: string }[];
};

type ApiData = {
  grouped: Record<string, InterestClick[]>;
  statuses: Record<string, FrozenStatus>;
  ranked: SuggestionBucket[];
};

type Props = {
  /** Endpoints base. Use "/api/admin" em prod, "/api/admin" também — apenas o GET muda em modo preview. */
  fetchUrl?: string;
  statusBaseUrl?: string;
};

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  // BOM pra Excel abrir com acentos corretos
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatCsvDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function AdminInterestPanel({
  fetchUrl = "/api/admin/interest",
  statusBaseUrl = "/api/admin/games"
}: Props = {}) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(fetchUrl);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Erro ao carregar");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function setStatus(slug: string, status: FrozenStatus) {
    setUpdating((p) => ({ ...p, [slug]: true }));
    try {
      const r = await fetch(`${statusBaseUrl}/${slug}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setUpdating((p) => ({ ...p, [slug]: false }));
    }
  }

  const totalClicks = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.grouped).reduce((s, arr) => s + arr.length, 0);
  }, [data]);

  const totalSuggestions = useMemo(
    () => data?.ranked.reduce((s, b) => s + b.count, 0) ?? 0,
    [data]
  );

  function exportAllClicks() {
    if (!data) return;
    const rows: (string | number)[][] = [["Jogo (slug)", "Nick", "Tag/contato", "Data"]];
    for (const [slug, items] of Object.entries(data.grouped)) {
      for (const c of items) {
        rows.push([slug, c.nick, c.tag || "", formatCsvDate(c.createdAt)]);
      }
    }
    downloadCSV(`interessados_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function exportSlugClicks(slug: string, clicks: InterestClick[]) {
    const rows: (string | number)[][] = [["Nick", "Tag/contato", "Data"]];
    for (const c of clicks) {
      rows.push([c.nick, c.tag || "", formatCsvDate(c.createdAt)]);
    }
    downloadCSV(`interessados_${slug}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function exportSuggestions() {
    if (!data) return;
    const rows: (string | number)[][] = [["Jogo pedido", "Total de pedidos", "Nick", "Tag/contato", "Data"]];
    for (const bucket of data.ranked) {
      for (const it of bucket.items) {
        rows.push([bucket.displayName, bucket.count, it.nick, it.tag || "", formatCsvDate(it.createdAt)]);
      }
    }
    downloadCSV(`sugestoes_jogos_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="space-y-6 text-ppb-text">
      {/* HEADER */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase text-ppb-text">
                Interesse dos jogadores
              </h2>
              <p className="mt-1 text-sm text-ppb-muted">
                Quem clicou em jogos congelados e quem está sugerindo jogos novos. Use os contadores
                pra decidir quando abrir um novo campeonato.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={exportAllClicks}
              disabled={loading || totalClicks === 0}
              title="Baixar CSV com todos os cliques de interesse"
              className="inline-flex items-center gap-1.5 rounded-full border border-ppb-primary/40 bg-ppb-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-primary transition hover:bg-ppb-primary/25 disabled:opacity-40"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              Atualizar
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatTile icon={<Users className="h-4 w-4" />} label="Cliques de interesse" value={totalClicks} />
          <StatTile icon={<Crown className="h-4 w-4" />} label="Sugestões de jogos" value={totalSuggestions} />
          <StatTile icon={<Lock className="h-4 w-4" />} label="Jogos congelados" value={
            Object.values(data?.statuses ?? {}).filter((s) => s === "frozen").length
          } />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      {/* GRID: STATUS + CLIQUES POR JOGO */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="mb-5 flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-ppb-primary" />
          <h3 className="font-display text-lg font-black uppercase text-ppb-text">
            Status + interesse por jogo
          </h3>
        </div>
        <ul className="space-y-3">
          {GAMES.map((game) => {
            const status: FrozenStatus = data?.statuses[game.slug] ?? "active";
            const clicks = data?.grouped[game.slug] ?? [];
            const isFrozen = status === "frozen";
            const isExpanded = expanded[game.slug];

            return (
              <li
                key={game.slug}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all",
                  isFrozen
                    ? "border-ppb-accent/40 bg-ppb-accent/5"
                    : "border-ppb-border bg-ppb-subtle/40"
                )}
              >
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl bg-cover bg-center ring-1 ring-ppb-border"
                    style={{ backgroundImage: `url(${game.coverImage})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-ppb-text">{game.name}</span>
                      {isFrozen ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ppb-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-accent ring-1 ring-ppb-accent/40">
                          <Lock className="h-2.5 w-2.5" />
                          Congelado
                        </span>
                      ) : status === "hidden" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70 ring-1 ring-white/20">
                          Oculto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/40">
                          <Unlock className="h-2.5 w-2.5" />
                          Ativo
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                      /jogos/{game.slug}
                    </div>
                  </div>

                  {/* CONTADOR DE INTERESSE */}
                  <div className="flex items-center gap-2 rounded-xl border border-ppb-border bg-ppb-surface px-3 py-2">
                    <Users className="h-3.5 w-3.5 text-ppb-primary" />
                    <span className="font-display text-base font-black text-ppb-text">
                      {clicks.length}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                      interessados
                    </span>
                  </div>

                  {/* TOGGLES DE STATUS */}
                  <div className="flex items-center gap-1 rounded-xl border border-ppb-border bg-ppb-surface p-1">
                    {(["active", "frozen", "hidden"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(game.slug, s)}
                        disabled={updating[game.slug] || status === s}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition",
                          status === s
                            ? s === "frozen"
                              ? "bg-ppb-accent text-ppb-background"
                              : s === "hidden"
                                ? "bg-white/90 text-ppb-background"
                                : "bg-emerald-500 text-white"
                            : "text-ppb-muted hover:bg-ppb-subtle hover:text-ppb-text",
                          updating[game.slug] && "cursor-wait opacity-60"
                        )}
                      >
                        {s === "active" ? "Ativo" : s === "frozen" ? "Congelar" : "Ocultar"}
                      </button>
                    ))}
                  </div>

                  {/* EXPAND */}
                  {clicks.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((p) => ({ ...p, [game.slug]: !p[game.slug] }))}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:bg-ppb-subtle hover:text-ppb-text"
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      Lista
                    </button>
                  ) : null}
                </div>

                {/* LISTA EXPANDIDA */}
                {isExpanded && clicks.length > 0 ? (
                  <div className="border-t border-ppb-border bg-ppb-background/40 px-4 py-3">
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => exportSlugClicks(game.slug, clicks)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ppb-primary/30 bg-ppb-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-primary transition hover:bg-ppb-primary/20"
                      >
                        <Download className="h-3 w-3" />
                        Baixar CSV
                      </button>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                          <th className="pb-2">Nick</th>
                          <th className="pb-2">Tag / contato</th>
                          <th className="pb-2 text-right">Quando</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ppb-border">
                        {clicks
                          .slice()
                          .reverse()
                          .map((c) => (
                            <tr key={c.id} className="text-ppb-text/90">
                              <td className="py-2 font-bold">{c.nick}</td>
                              <td className="py-2 text-ppb-muted">{c.tag || "—"}</td>
                              <td className="py-2 text-right text-ppb-mutedSoft">
                                {new Date(c.createdAt).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {/* RANKING DE SUGESTÕES */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ppb-accent" />
            <h3 className="font-display text-lg font-black uppercase text-ppb-text">
              Jogos mais pedidos (sugestões da Home)
            </h3>
          </div>
          <button
            type="button"
            onClick={exportSuggestions}
            disabled={totalSuggestions === 0}
            title="Baixar CSV com todas as sugestões"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ppb-accent/40 bg-ppb-accent/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-accent transition hover:bg-ppb-accent/25 disabled:opacity-40"
          >
            <Download className="h-3 w-3" />
            CSV
          </button>
        </div>
        {data && data.ranked.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ppb-border bg-ppb-subtle/40 p-8 text-center">
            <Crown className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
            <p className="mt-3 text-sm text-ppb-muted">Ainda não recebemos nenhuma sugestão.</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {data?.ranked.map((bucket, idx) => (
              <SuggestionRow key={bucket.displayName} bucket={bucket} rank={idx + 1} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ppb-border bg-ppb-subtle/40 p-3">
      <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-ppb-primary/15 blur-2xl" />
      <div className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        <span className="text-ppb-primary">{icon}</span>
        {label}
      </div>
      <div className="relative mt-1 font-display text-2xl font-black text-ppb-text">{value}</div>
    </div>
  );
}

function SuggestionRow({ bucket, rank }: { bucket: SuggestionBucket; rank: number }) {
  const [open, setOpen] = useState(false);
  const isTop = rank <= 3;
  const ringByRank = rank === 1
    ? "ring-ppb-gold/40 bg-gradient-to-r from-ppb-gold/10 to-transparent"
    : rank === 2
      ? "ring-white/30 bg-gradient-to-r from-white/8 to-transparent"
      : rank === 3
        ? "ring-amber-700/40 bg-gradient-to-r from-amber-700/10 to-transparent"
        : "";

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border border-ppb-border bg-ppb-subtle/40 transition-colors",
        isTop && "ring-1 ring-inset",
        isTop && ringByRank
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-black",
            rank === 1
              ? "bg-ppb-gold text-ppb-background"
              : rank === 2
                ? "bg-white text-ppb-background"
                : rank === 3
                  ? "bg-amber-700 text-white"
                  : "bg-ppb-subtle text-ppb-muted ring-1 ring-ppb-border"
          )}
        >
          #{rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-black uppercase text-ppb-text">
            {bucket.displayName}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
            {bucket.count} {bucket.count === 1 ? "pedido" : "pedidos"}
          </div>
        </div>
        <div className="font-display text-xl font-black text-ppb-primary">{bucket.count}</div>
        {open ? <ChevronDown className="h-4 w-4 text-ppb-muted" /> : <ChevronRight className="h-4 w-4 text-ppb-muted" />}
      </button>

      {open ? (
        <div className="border-t border-ppb-border bg-ppb-background/40 px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                <th className="pb-2">Quem pediu</th>
                <th className="pb-2">Contato</th>
                <th className="pb-2 text-right">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ppb-border">
              {bucket.items.slice().reverse().map((it) => (
                <tr key={it.id} className="text-ppb-text/90">
                  <td className="py-2 font-bold">{it.nick}</td>
                  <td className="py-2 text-ppb-muted">{it.tag || "—"}</td>
                  <td className="py-2 text-right text-ppb-mutedSoft">
                    {new Date(it.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </li>
  );
}
