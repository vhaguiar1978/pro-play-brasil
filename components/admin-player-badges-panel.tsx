"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Crown,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";

type Badge = {
  nickname: string;
  logoUrl: string | null;
  grantedBy: "champion" | "admin";
  grantedAt: string;
  grantedReason?: string;
  active: boolean;
  updatedAt: string;
};

type Props = {
  apiBase?: string;
};

export function AdminPlayerBadgesPanel({ apiBase = "/api/admin/player-badges" }: Props = {}) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [grantNick, setGrantNick] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(apiBase);
      const data = await r.json();
      setBadges(data.badges ?? []);
    } catch {
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  async function grantManual() {
    if (!grantNick.trim()) return;
    setGranting(true);
    setError(null);
    try {
      const r = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: grantNick.trim(), reason: grantReason.trim() || undefined })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      setGrantNick("");
      setGrantReason("");
      setFlash("Selo liberado");
      setTimeout(() => setFlash(null), 2500);
      await fetchBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setGranting(false);
    }
  }

  async function toggle(b: Badge) {
    try {
      const r = await fetch(`${apiBase}/${encodeURIComponent(b.nickname)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !b.active })
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erro");
      setFlash(!b.active ? "Selo reativado" : "Selo pausado");
      setTimeout(() => setFlash(null), 2500);
      await fetchBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function remove(b: Badge) {
    if (!confirm(`Remover selo de ${b.nickname}? Vai apagar o logo também.`)) return;
    try {
      const r = await fetch(`${apiBase}/${encodeURIComponent(b.nickname)}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error || "Erro");
      setFlash("Selo removido");
      setTimeout(() => setFlash(null), 2500);
      await fetchBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  const active = badges.filter((b) => b.active).length;
  const paused = badges.length - active;
  const fromChampion = badges.filter((b) => b.grantedBy === "champion").length;

  return (
    <div className="space-y-5 text-ppb-text">
      {/* HEADER */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-gold/15 text-ppb-gold ring-1 ring-ppb-gold/40">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase text-ppb-text">
                Selos de campeão
              </h2>
              <p className="mt-1 text-sm text-ppb-muted">
                Selo libera o player a colocar um logo ao lado do nome em ranking, brackets e perfis. Concedido
                automaticamente ao vencer uma final, ou manualmente por você.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchBadges}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Atualizar
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<Crown className="h-3.5 w-3.5" />} label="Total" value={badges.length} tone="gold" />
          <Stat icon={<Play className="h-3.5 w-3.5" />} label="Ativos" value={active} tone="emerald" />
          <Stat icon={<Pause className="h-3.5 w-3.5" />} label="Pausados" value={paused} tone="amber" />
          <Stat icon={<Shield className="h-3.5 w-3.5" />} label="Por vitória" value={fromChampion} tone="primary" />
        </div>

        {flash ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            <Check className="h-3.5 w-3.5" />
            {flash}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        ) : null}
      </div>

      {/* LIBERAR MANUAL */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-base font-black uppercase text-ppb-text">
          <Plus className="h-4 w-4 text-ppb-gold" />
          Liberar manualmente
        </h3>
        <p className="mb-3 text-xs text-ppb-muted">
          Use isso pra premiar um jogador fora do fluxo de campeonato (parceria, MVP de evento, etc.).
        </p>
        <div className="grid gap-2 md:grid-cols-[1fr,1fr,auto]">
          <input
            type="text"
            value={grantNick}
            onChange={(e) => setGrantNick(e.target.value)}
            placeholder="Nickname"
            className="rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2 text-sm font-bold text-ppb-text focus:border-ppb-gold focus:outline-none"
          />
          <input
            type="text"
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            placeholder="Motivo (opcional). Ex: Convidado VIP"
            className="rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2 text-sm text-ppb-text focus:border-ppb-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={grantManual}
            disabled={granting || !grantNick.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ppb-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-background shadow-[0_0_24px_rgba(243,178,79,0.35)] transition hover:bg-ppb-gold/90 disabled:opacity-50"
          >
            {granting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crown className="h-3.5 w-3.5" />}
            Liberar selo
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
        <h3 className="mb-3 font-display text-base font-black uppercase text-ppb-text">
          Selos liberados ({badges.length})
        </h3>
        {badges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ppb-border bg-ppb-subtle/40 p-8 text-center">
            <Crown className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
            <p className="mt-3 text-sm text-ppb-muted">
              Nenhum selo liberado. Quando alguém vencer um campeonato (ou você liberar manualmente acima),
              aparece aqui.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {badges
              .slice()
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((b) => (
                <li
                  key={b.nickname}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-2xl border p-3",
                    b.active
                      ? "border-ppb-gold/30 bg-gradient-to-r from-ppb-gold/5 to-transparent"
                      : "border-ppb-border bg-ppb-subtle/40 opacity-60"
                  )}
                >
                  <PlayerAvatar nick={b.nickname} size="sm" />
                  {b.logoUrl ? (
                    <span className="h-7 w-7 shrink-0 overflow-hidden rounded-md ring-1 ring-ppb-gold/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logoUrl} alt="" className="h-full w-full object-cover" />
                    </span>
                  ) : (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ppb-gold/20 text-ppb-gold ring-1 ring-ppb-gold/40">
                      <Crown className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-ppb-text">{b.nickname}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1",
                          b.grantedBy === "champion"
                            ? "bg-ppb-primary/15 text-ppb-primary ring-ppb-primary/30"
                            : "bg-ppb-accent/15 text-ppb-accent ring-ppb-accent/30"
                        )}
                      >
                        {b.grantedBy === "champion" ? "Por vitória" : "Pelo admin"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1",
                          b.active
                            ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
                            : "bg-amber-500/15 text-amber-300 ring-amber-500/40"
                        )}
                      >
                        {b.active ? "Ativo" : "Pausado"}
                      </span>
                    </div>
                    <div className="text-[10px] text-ppb-mutedSoft">
                      {b.grantedReason ?? "—"} · liberado em {new Date(b.grantedAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(b)}
                    className="inline-flex items-center gap-1 rounded-lg border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-amber-500/40 hover:text-amber-300"
                  >
                    {b.active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {b.active ? "Pausar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b)}
                    className="inline-flex items-center gap-1 rounded-lg border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-rose-500/40 hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "gold" | "emerald" | "amber" | "primary";
}) {
  const TONE = {
    gold: "text-ppb-gold bg-ppb-gold/10 ring-ppb-gold/30",
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/30",
    amber: "text-amber-300 bg-amber-500/10 ring-amber-500/30",
    primary: "text-ppb-primary bg-ppb-primary/10 ring-ppb-primary/30"
  }[tone];
  return (
    <div className={cn("rounded-xl px-3 py-2.5 ring-1", TONE)}>
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-display text-xl font-black text-ppb-text">{value}</div>
    </div>
  );
}
