"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Crown,
  Loader2,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Trophy,
  UserPlus,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

type MatchPlayer = { nickname: string; teamName?: string };
type MatchStatus = "tbd" | "pending" | "result_submitted" | "disputed" | "finalized" | "bye";

type ServerRegistration = {
  tournamentId: string;
  nickname: string;
  teamName: string;
  platform: string;
  whatsapp: string;
  paymentMethod: "free" | "mercado_pago" | "pagseguro" | "ppc";
  paymentStatus: "free" | "paid";
  createdAt: string;
};

type Match = {
  id: string;
  round: number;
  roundLabel: string;
  playerA: MatchPlayer | null;
  playerB: MatchPlayer | null;
  status: MatchStatus;
  submittedScoreA: number | null;
  submittedScoreB: number | null;
  submittedBy: "A" | "B" | "admin" | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: "A" | "B" | null;
  disputeReason: string | null;
};

type Tournament = {
  id: string;
  name: string;
  participants?: Array<{ nickname: string; teamName?: string | null }>;
  registered?: number;
  maxPlayers?: number;
};

type Props = {
  tournament: Tournament;
  /** Base do endpoint admin de tournaments (suporta preview sem auth). Padrão: /api/admin/tournaments */
  apiBase?: string;
  /** Base do endpoint público (matches). Padrão: /api */
  publicApiBase?: string;
};

export function AdminMatchesPanel({
  tournament,
  apiBase = "/api/admin/tournaments",
  publicApiBase = "/api"
}: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [registrations, setRegistrations] = useState<ServerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveScoreA, setResolveScoreA] = useState("");
  const [resolveScoreB, setResolveScoreB] = useState("");

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${publicApiBase}/tournaments/${tournament.id}/matches`);
      const data = await r.json();
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [tournament.id, publicApiBase]);

  const fetchRegistrations = useCallback(async () => {
    setLoadingRegs(true);
    try {
      const r = await fetch(`${apiBase}/${tournament.id}/registrations`, {
        cache: "no-store"
      });
      const data = await r.json();
      setRegistrations((data.registrations ?? []) as ServerRegistration[]);
    } catch {
      setRegistrations([]);
    } finally {
      setLoadingRegs(false);
    }
  }, [tournament.id, apiBase]);

  useEffect(() => {
    fetchMatches();
    fetchRegistrations();
  }, [fetchMatches, fetchRegistrations]);

  async function startTournament() {
    if (registrations.length < 2) {
      setError("Precisa de pelo menos 2 inscritos pra gerar o bracket.");
      return;
    }
    if (!confirm(`Vai gerar o bracket com ${registrations.length} inscrito(s). Se já existir, será sobrescrito. Confirma?`)) return;
    setStarting(true);
    setError(null);
    try {
      const participants = registrations.map((r) => ({
        nickname: r.nickname,
        teamName: r.teamName || undefined,
        whatsapp: r.whatsapp || undefined
      }));
      const r = await fetch(`${apiBase}/${tournament.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      setFlash("Bracket gerado!");
      setTimeout(() => setFlash(null), 2500);
      await fetchMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setStarting(false);
    }
  }

  async function removeRegistration(nickname: string) {
    if (!confirm(`Remover inscrição de ${nickname}?`)) return;
    try {
      const r = await fetch(
        `${apiBase}/${tournament.id}/registrations/${encodeURIComponent(nickname)}`,
        { method: "DELETE" }
      );
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao remover");
      }
      setFlash(`${nickname} removido.`);
      setTimeout(() => setFlash(null), 2500);
      await fetchRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function resolveMatch(matchId: string) {
    const a = Number(resolveScoreA);
    const b = Number(resolveScoreB);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) {
      setError("Defina um vencedor (placar diferente).");
      return;
    }
    try {
      const r = await fetch(`/api/admin/matches/${matchId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreA: a, scoreB: b })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      setFlash("Resultado forçado pelo admin.");
      setTimeout(() => setFlash(null), 2500);
      setResolveId(null);
      setResolveScoreA("");
      setResolveScoreB("");
      await fetchMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  const disputed = matches.filter((m) => m.status === "disputed");
  const pendingConfirm = matches.filter((m) => m.status === "result_submitted");
  const playable = matches.filter((m) => m.status === "pending");
  const finalized = matches.filter((m) => m.status === "finalized" || m.status === "bye");
  const tbd = matches.filter((m) => m.status === "tbd");

  return (
    <div className="space-y-5 text-ppb-text">
      {/* HEADER */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase text-ppb-text">
                Chaveamento — {tournament.name}
              </h2>
              <p className="mt-1 text-sm text-ppb-muted">
                Gera o bracket, acompanha matches em andamento e resolve disputas. O avanço dos vencedores é automático.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={fetchMatches}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={startTournament}
              disabled={starting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ppb-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:opacity-50"
            >
              {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {matches.length > 0 ? "Regenerar bracket" : "Iniciar campeonato"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat icon={<Sparkles className="h-3.5 w-3.5" />} label="Prontas" value={playable.length} tone="emerald" />
          <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Aguardando" value={pendingConfirm.length} tone="amber" />
          <Stat icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Em disputa" value={disputed.length} tone="rose" />
          <Stat icon={<Crown className="h-3.5 w-3.5" />} label="Finalizadas" value={finalized.length} tone="gold" />
          <Stat icon={<Users className="h-3.5 w-3.5" />} label="A definir" value={tbd.length} tone="muted" />
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

      {/* SEÇÃO: INSCRITOS DO SERVER (fonte do bracket) */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/30">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-accent">
                Inscritos no server
              </div>
              <div className="font-display text-base font-black text-ppb-text">
                {registrations.length}
                {tournament.maxPlayers ? ` / ${tournament.maxPlayers}` : ""} confirmados
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchRegistrations}
            disabled={loadingRegs}
            className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", loadingRegs && "animate-spin")} />
            Atualizar
          </button>
        </div>

        {registrations.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-ppb-border bg-ppb-background/30 px-4 py-6 text-center text-xs text-ppb-mutedSoft">
            Nenhuma inscrição ainda. Compartilhe o link de inscrição pra começar a preencher o chaveamento.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {registrations.map((r, idx) => (
              <li
                key={`${r.nickname}-${idx}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-ppb-border bg-ppb-background/40 px-3 py-2"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ppb-primary/15 font-mono text-[11px] font-black text-ppb-primary">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-ppb-text">{r.nickname}</span>
                    {r.teamName ? (
                      <span className="truncate text-[11px] text-ppb-mutedSoft">— {r.teamName}</span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-wider text-ppb-mutedSoft">
                    <span>{r.platform}</span>
                    {r.whatsapp ? <span className="font-mono normal-case tracking-normal">{r.whatsapp}</span> : null}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px font-bold",
                        r.paymentStatus === "paid"
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                          : "bg-ppb-subtle text-ppb-mutedSoft ring-1 ring-ppb-border"
                      )}
                    >
                      {r.paymentStatus === "paid" ? "Pago" : "Free"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRegistration(r.nickname)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SEÇÃO: DISPUTAS (prioridade visual) */}
      {disputed.length > 0 ? (
        <Section title="🚨 Disputas pra resolver" tone="rose">
          <ul className="space-y-3">
            {disputed.map((m) => (
              <AdminMatchRow
                key={m.id}
                match={m}
                resolveId={resolveId}
                resolveScoreA={resolveScoreA}
                resolveScoreB={resolveScoreB}
                setResolveId={setResolveId}
                setResolveScoreA={setResolveScoreA}
                setResolveScoreB={setResolveScoreB}
                onResolve={resolveMatch}
                showReason
              />
            ))}
          </ul>
        </Section>
      ) : null}

      {/* SEÇÃO: AGUARDANDO CONFIRMAÇÃO */}
      {pendingConfirm.length > 0 ? (
        <Section title="⏰ Aguardando confirmação do adversário">
          <ul className="space-y-3">
            {pendingConfirm.map((m) => (
              <AdminMatchRow
                key={m.id}
                match={m}
                resolveId={resolveId}
                resolveScoreA={resolveScoreA}
                resolveScoreB={resolveScoreB}
                setResolveId={setResolveId}
                setResolveScoreA={setResolveScoreA}
                setResolveScoreB={setResolveScoreB}
                onResolve={resolveMatch}
              />
            ))}
          </ul>
        </Section>
      ) : null}

      {/* SEÇÃO: PRONTAS PRA JOGAR */}
      {playable.length > 0 ? (
        <Section title="⚔️ Prontas pra jogar">
          <ul className="space-y-3">
            {playable.map((m) => (
              <AdminMatchRow
                key={m.id}
                match={m}
                resolveId={resolveId}
                resolveScoreA={resolveScoreA}
                resolveScoreB={resolveScoreB}
                setResolveId={setResolveId}
                setResolveScoreA={setResolveScoreA}
                setResolveScoreB={setResolveScoreB}
                onResolve={resolveMatch}
              />
            ))}
          </ul>
        </Section>
      ) : null}

      {/* SEÇÃO: FINALIZADAS */}
      {finalized.length > 0 ? (
        <Section title="✓ Finalizadas">
          <ul className="space-y-2">
            {finalized.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-ppb-border bg-ppb-subtle/40 px-3 py-2 text-xs"
              >
                <span className="rounded-full bg-ppb-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-gold ring-1 ring-ppb-gold/30">
                  {m.roundLabel}
                </span>
                <span className="flex-1 truncate text-ppb-text">
                  <strong className={cn(m.winner === "A" && "text-ppb-gold")}>
                    {m.playerA?.nickname ?? "—"}
                  </strong>{" "}
                  {m.scoreA} <span className="text-ppb-muted">x</span> {m.scoreB}{" "}
                  <strong className={cn(m.winner === "B" && "text-ppb-gold")}>
                    {m.playerB?.nickname ?? "—"}
                  </strong>
                </span>
                {m.status === "bye" ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ppb-mutedSoft">BYE</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {matches.length === 0 && !loading ? (
        <div className="rounded-3xl border border-dashed border-ppb-border bg-ppb-subtle/40 p-10 text-center">
          <Trophy className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
          <p className="mt-3 text-sm text-ppb-muted">
            Bracket ainda não foi gerado. {registrations.length >= 2 ? (
              <>Clica em <strong>Iniciar campeonato</strong> pra usar os {registrations.length} inscritos atuais.</>
            ) : (
              <>Faltam inscrições — assim que houver pelo menos 2, dá pra iniciar manualmente. O bracket também gera sozinho quando bater o limite de vagas.</>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  tone,
  children
}: {
  title: string;
  tone?: "rose";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-ppb-surface p-5",
        tone === "rose" ? "border-rose-500/40" : "border-ppb-border"
      )}
    >
      <h3 className="mb-3 font-display text-sm font-black uppercase tracking-wider text-ppb-text">
        {title}
      </h3>
      {children}
    </div>
  );
}

function AdminMatchRow({
  match,
  resolveId,
  resolveScoreA,
  resolveScoreB,
  setResolveId,
  setResolveScoreA,
  setResolveScoreB,
  onResolve,
  showReason
}: {
  match: Match;
  resolveId: string | null;
  resolveScoreA: string;
  resolveScoreB: string;
  setResolveId: (id: string | null) => void;
  setResolveScoreA: (v: string) => void;
  setResolveScoreB: (v: string) => void;
  onResolve: (id: string) => void;
  showReason?: boolean;
}) {
  const isResolving = resolveId === match.id;
  return (
    <li className="rounded-2xl border border-ppb-border bg-ppb-subtle/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-ppb-primary/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-primary ring-1 ring-ppb-primary/30">
          {match.roundLabel}
        </span>
        <span className="flex-1 truncate text-sm font-bold text-ppb-text">
          {match.playerA?.nickname ?? "—"} <span className="text-ppb-muted">vs</span>{" "}
          {match.playerB?.nickname ?? "—"}
        </span>
        {match.submittedScoreA !== null && match.submittedScoreB !== null ? (
          <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30">
            Sugerido: {match.submittedScoreA} x {match.submittedScoreB}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setResolveId(isResolving ? null : match.id);
            setResolveScoreA(match.submittedScoreA?.toString() ?? "");
            setResolveScoreB(match.submittedScoreB?.toString() ?? "");
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
        >
          <Shield className="h-3 w-3" />
          {isResolving ? "Cancelar" : "Forçar resultado"}
        </button>
      </div>

      {showReason && match.disputeReason ? (
        <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs italic text-rose-200 ring-1 ring-rose-500/30">
          &ldquo;{match.disputeReason}&rdquo;
        </p>
      ) : null}

      {isResolving ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-ppb-background/40 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">Placar:</span>
          <input
            type="number"
            min={0}
            value={resolveScoreA}
            onChange={(e) => setResolveScoreA(e.target.value)}
            placeholder="0"
            className="w-16 rounded-lg border border-ppb-border bg-ppb-subtle px-2 py-1.5 text-center font-display font-black text-ppb-text focus:border-ppb-primary focus:outline-none"
          />
          <span className="text-ppb-muted">x</span>
          <input
            type="number"
            min={0}
            value={resolveScoreB}
            onChange={(e) => setResolveScoreB(e.target.value)}
            placeholder="0"
            className="w-16 rounded-lg border border-ppb-border bg-ppb-subtle px-2 py-1.5 text-center font-display font-black text-ppb-text focus:border-ppb-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onResolve(match.id)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-400"
          >
            <Check className="h-3 w-3" />
            Salvar
          </button>
        </div>
      ) : null}
    </li>
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
  tone: "emerald" | "amber" | "rose" | "gold" | "muted";
}) {
  const TONE = {
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/30",
    amber: "text-amber-300 bg-amber-500/10 ring-amber-500/30",
    rose: "text-rose-300 bg-rose-500/10 ring-rose-500/30",
    gold: "text-ppb-gold bg-ppb-gold/10 ring-ppb-gold/30",
    muted: "text-ppb-mutedSoft bg-white/5 ring-white/15"
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
