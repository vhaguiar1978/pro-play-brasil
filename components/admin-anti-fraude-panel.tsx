"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Flame,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type FraudFlagType =
  | "rapid_betting"
  | "high_value_new_account"
  | "ip_collision"
  | "all_in_streak"
  | "admin_manual";

type FraudFlag = {
  id: string;
  betId: string;
  type: FraudFlagType;
  score: number;
  reason: string;
  status: "pending" | "approved_payout" | "rejected_void";
  createdAt: string;
  resolvedAt: string | null;
  adminNote: string | null;
};

const FLAG_LABEL: Record<FraudFlagType, string> = {
  rapid_betting: "Apostas em rajada",
  high_value_new_account: "Conta nova, valor alto",
  ip_collision: "Mesmo IP em várias contas",
  all_in_streak: "Sequência de all-in",
  admin_manual: "Marcação manual"
};

const FLAG_ICON: Record<FraudFlagType, React.ComponentType<{ className?: string }>> = {
  rapid_betting: Flame,
  high_value_new_account: AlertTriangle,
  ip_collision: ShieldAlert,
  all_in_streak: Flame,
  admin_manual: ShieldAlert
};

export function AdminAntiFraudePanel() {
  const [flags, setFlags] = useState<FraudFlag[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/fraud-flags");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao buscar fila");
      setFlags(data.flags ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function action(flag: FraudFlag, kind: "approve" | "reject") {
    const note = (notes[flag.id] ?? "").trim();
    if (kind === "reject" && !note) {
      setError(`Pra rejeitar, escreva uma nota de auditoria explicando o motivo.`);
      return;
    }
    setActionId(flag.id);
    setError(null);
    setFlash(null);
    try {
      const r = await fetch(`/api/admin/bets/${encodeURIComponent(flag.betId)}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || (kind === "approve" ? "Aprovado pelo admin" : "") })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      setFlash(
        kind === "approve"
          ? `Payout liberado (${data.credited ?? 0} PPC creditados).`
          : "Aposta rejeitada — stake retido como penalidade."
      );
      setNotes((prev) => {
        const next = { ...prev };
        delete next[flag.id];
        return next;
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black uppercase tracking-wider text-ppb-text">
                Fila anti-fraude
              </h2>
              <p className="text-xs text-ppb-muted">
                Apostas vencedoras que o sistema marcou como suspeitas. Payout fica retido
                até você aprovar ou rejeitar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Atualizar
          </button>
        </div>

        {/* contadores */}
        {flags ? (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatTile label="Pendentes" value={flags.length} tone="warn" />
            <StatTile
              label="Score médio"
              value={
                flags.length > 0
                  ? Math.round(flags.reduce((s, f) => s + f.score, 0) / flags.length)
                  : 0
              }
              tone="info"
              suffix="/100"
            />
            <StatTile
              label="Críticas (≥80)"
              value={flags.filter((f) => f.score >= 80).length}
              tone="danger"
            />
          </div>
        ) : null}

        {flash ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {flash}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        ) : null}
      </div>

      {/* lista */}
      {flags == null ? (
        <div className="flex items-center justify-center rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/40 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-ppb-primary" />
        </div>
      ) : flags.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              note={notes[flag.id] ?? ""}
              onNoteChange={(value) => setNotes((prev) => ({ ...prev, [flag.id]: value }))}
              onApprove={() => action(flag, "approve")}
              onReject={() => action(flag, "reject")}
              busy={actionId === flag.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────── PIECES ───────────────

function FlagCard({
  flag,
  note,
  onNoteChange,
  onApprove,
  onReject,
  busy
}: {
  flag: FraudFlag;
  note: string;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const Icon = FLAG_ICON[flag.type];
  const isCritical = flag.score >= 80;
  const isModerate = flag.score >= 60 && flag.score < 80;
  return (
    <div
      className={cn(
        "rounded-3xl border bg-ppb-surface p-5 shadow-ppb-card transition",
        isCritical
          ? "border-rose-500/50 ring-1 ring-rose-500/30"
          : isModerate
            ? "border-amber-500/40"
            : "border-ppb-border"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
              isCritical
                ? "bg-rose-500/15 text-rose-300 ring-rose-500/30"
                : isModerate
                  ? "bg-amber-500/15 text-amber-300 ring-amber-500/30"
                  : "bg-ppb-primary/10 text-ppb-primary ring-ppb-primary/30"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-mutedSoft">
              {FLAG_LABEL[flag.type]}
            </div>
            <h3 className="font-display text-sm font-black uppercase text-ppb-text">
              {flag.reason}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-ppb-mutedSoft">
              <Clock className="h-3 w-3" />
              {new Date(flag.createdAt).toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ring-1",
            isCritical
              ? "bg-rose-500/15 text-rose-300 ring-rose-500/40"
              : isModerate
                ? "bg-amber-500/15 text-amber-300 ring-amber-500/40"
                : "bg-ppb-primary/10 text-ppb-primary ring-ppb-primary/30"
          )}
        >
          Score {flag.score}/100
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
            Nota de auditoria
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Ex: confirmei no log, mesmo dispositivo de outra conta — fraude."
            className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-background px-3 py-2 text-sm text-ppb-text focus:border-ppb-primary focus:outline-none"
          />
          <div className="mt-1 flex items-center gap-2 text-[10px] text-ppb-mutedSoft">
            <span className="rounded bg-ppb-subtle px-1.5 py-0.5 font-mono text-[9px]">
              bet={flag.betId.slice(0, 8)}…
            </span>
            <Link
              href={`/admin/bets/${flag.betId}`}
              className="text-ppb-accent hover:underline"
            >
              Abrir bet
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
          Aprovar payout
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={busy || !note.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
          Rejeitar (perde stake)
        </button>
      </div>
      {!note.trim() ? (
        <p className="mt-2 text-[10px] text-ppb-mutedSoft">
          <X className="mr-1 inline h-2.5 w-2.5" />
          Pra rejeitar é obrigatório escrever a nota (auditoria).
        </p>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  suffix
}: {
  label: string;
  value: number;
  tone: "warn" | "info" | "danger";
  suffix?: string;
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
      : tone === "warn"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-ppb-accent/40 bg-ppb-accent/10 text-ppb-accent";
  return (
    <div className={cn("rounded-2xl border px-3 py-3", toneClass)}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 font-display text-2xl font-black">
        {value}
        {suffix ? <span className="ml-0.5 text-sm opacity-70">{suffix}</span> : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/40 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
        <ShieldCheck className="h-7 w-7 text-emerald-300" />
      </div>
      <h3 className="mt-4 font-display text-base font-black uppercase tracking-wider text-ppb-text">
        Fila limpa
      </h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-ppb-muted">
        Nenhuma aposta suspeita pendente. As heurísticas (rajada, conta nova com valor alto,
        colisão de IP) só geram flag quando o padrão bate. Continue de olho.
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        <Inbox className="h-3 w-3" />
        Sem pendências
      </div>
    </div>
  );
}
