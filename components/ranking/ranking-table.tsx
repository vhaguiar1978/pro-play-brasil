"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ChampionBadge } from "@/components/ui/champion-badge";

type Row = {
  pos: number;
  nick: string;
  pts: number;
  wins: number;
  city: string;
  uf: string;
  gameName?: string;
};

type Props = {
  rows: Row[];
  showGame?: boolean;
  initialQuery?: string;
};

const TOP_BG: Record<number, string> = {
  1: "bg-gradient-to-r from-ppb-gold/15 to-transparent ring-ppb-gold/30",
  2: "bg-gradient-to-r from-white/10 to-transparent ring-white/20",
  3: "bg-gradient-to-r from-amber-700/10 to-transparent ring-amber-700/30"
};

const POS_COLOR: Record<number, string> = {
  1: "text-ppb-gold",
  2: "text-white",
  3: "text-amber-500"
};

export function RankingTable({ rows, showGame, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.nick.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.uf.toLowerCase().includes(q) ||
        (r.gameName ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card">
      {/* HEADER COM BUSCA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ppb-border px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-ppb-muted">
          <Users className="h-3.5 w-3.5 text-ppb-primary" />
          {filtered.length} {filtered.length === 1 ? "jogador" : "jogadores"}
          {query ? <span className="text-ppb-mutedSoft">· filtrando por “{query}”</span> : null}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nick, cidade ou estado"
            className="w-full rounded-xl border border-ppb-border bg-ppb-subtle py-2 pl-9 pr-3 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
          />
        </div>
      </div>

      {/* CABEÇALHO COLUNAS */}
      <div
        className={cn(
          "grid items-center gap-3 border-b border-ppb-border px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft",
          showGame
            ? "grid-cols-[44px,1fr,90px,70px,55px] sm:grid-cols-[44px,1fr,110px,110px,70px,55px]"
            : "grid-cols-[44px,1fr,70px,55px] sm:grid-cols-[44px,1fr,140px,70px,55px]"
        )}
      >
        <span>Pos</span>
        <span>Jogador</span>
        {showGame ? <span className="hidden sm:block">Jogo</span> : null}
        <span className="hidden sm:block">Cidade</span>
        <span className="text-right">Pts</span>
        <span className="text-right">Vit</span>
      </div>

      {/* LINHAS */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
          <p className="mt-3 text-sm text-ppb-muted">Nenhum jogador encontrado.</p>
        </div>
      ) : (
        <ul className="divide-y divide-ppb-border">
          {filtered.map((r) => {
            const isTop = r.pos <= 3;
            const topClass = isTop ? TOP_BG[r.pos] : "";
            return (
              <li
                key={`${r.pos}-${r.nick}-${r.gameName ?? ""}`}
                className={cn(
                  "grid items-center gap-3 px-6 py-3 transition-colors hover:bg-ppb-subtle/40",
                  showGame
                    ? "grid-cols-[44px,1fr,90px,70px,55px] sm:grid-cols-[44px,1fr,110px,110px,70px,55px]"
                    : "grid-cols-[44px,1fr,70px,55px] sm:grid-cols-[44px,1fr,140px,70px,55px]",
                  isTop && "ring-1 ring-inset",
                  isTop && topClass
                )}
              >
                <span
                  className={cn(
                    "font-display text-base font-black",
                    isTop ? POS_COLOR[r.pos] : "text-ppb-muted"
                  )}
                >
                  #{r.pos}
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  <PlayerAvatar
                    nick={r.nick}
                    position={isTop ? (r.pos as 1 | 2 | 3) : undefined}
                    size="md"
                  />
                  <ChampionBadge nick={r.nick} size="sm" />
                  <span className="truncate font-bold text-ppb-text">{r.nick}</span>
                </span>
                {showGame ? (
                  <span className="hidden truncate text-[10px] font-bold uppercase tracking-wider text-ppb-primary sm:block">
                    {r.gameName ?? "—"}
                  </span>
                ) : null}
                <span className="hidden truncate text-xs text-ppb-muted sm:block">
                  {r.city !== "–" ? `${r.city} · ${r.uf}` : "—"}
                </span>
                <span className="text-right font-display text-base font-black text-ppb-text">
                  {r.pts.toLocaleString("pt-BR")}
                </span>
                <span className="text-right text-sm font-bold text-ppb-muted">{r.wins}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
