"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  Check,
  Coins,
  Edit3,
  Layers,
  Loader2,
  Lock,
  Plus,
  Save,
  Settings,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES, getGameBySlug } from "@/lib/games";
import { MOCK_TOURNAMENTS, type MockTournament } from "@/lib/mock-tournaments";
import { StatusBadge } from "@/components/ui/status-badge";

type Status = "open" | "live" | "finished";
type Format = "eliminacao" | "grupos" | "pontos";

type FormState = {
  name: string;
  gameSlug: string;
  description: string;
  platform: string;
  maxPlayers: number;
  minimumPlayers: number;
  registered: number;
  startDate: string; // datetime-local
  feeLabel: string;
  prize: string;
  format: Format;
  status: Status;
  regionLabel: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  gameSlug: GAMES[0]?.slug ?? "",
  description: "",
  platform: "PC",
  maxPlayers: 16,
  minimumPlayers: 1,
  registered: 0,
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  feeLabel: "",
  prize: "",
  format: "eliminacao",
  status: "open",
  regionLabel: "Brasil"
};

function isoToLocal(iso: string): string {
  // "2026-04-26T21:30:00-03:00" → "2026-04-26T21:30"
  return new Date(iso).toISOString().slice(0, 16);
}

function localToIso(local: string): string {
  // datetime-local não tem timezone — interpretamos como horário local
  return new Date(local).toISOString();
}

function formatDisplay(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(".", "");
}

type Props = {
  apiBase?: string;
  /** Base URL pra abrir chaveamento do tournament. */
  matchesBaseHref?: string;
};

export function AdminTournamentsEditorPanel({
  apiBase = "/api/admin/tournaments",
  matchesBaseHref = "/admin/campeonatos"
}: Props = {}) {
  const [serverList, setServerList] = useState<MockTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(apiBase);
      const data = await r.json();
      setServerList(data.tournaments ?? []);
    } catch {
      setServerList([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function startNew() {
    setEditingId("new");
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  function startEdit(t: MockTournament) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      gameSlug: t.gameSlug,
      description: t.description ?? "",
      platform: t.platform,
      maxPlayers: t.maxPlayers,
      minimumPlayers: t.minimumPlayers ?? 1,
      registered: t.registered,
      startDate: isoToLocal(t.startDate),
      feeLabel: t.feeLabel ?? "",
      prize: t.prize,
      format: t.format,
      status: t.status,
      regionLabel: t.regionLabel
    });
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        gameSlug: form.gameSlug,
        description: form.description,
        platform: form.platform,
        maxPlayers: Number(form.maxPlayers),
        minimumPlayers: Number(form.minimumPlayers) || undefined,
        registered: Number(form.registered),
        startDate: localToIso(form.startDate),
        feeLabel: form.feeLabel.trim() || null,
        prize: form.prize,
        format: form.format,
        status: form.status,
        regionLabel: form.regionLabel
      };

      const isCreate = editingId === "new";
      const url = isCreate ? apiBase : `${apiBase}/${editingId}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao salvar");
      await refetch();
      setEditingId(null);
      setFlash(isCreate ? "Campeonato criado" : "Campeonato atualizado");
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Tem certeza? Vai apagar este campeonato permanentemente.")) return;
    try {
      const r = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      await refetch();
      setFlash("Campeonato removido");
      setTimeout(() => setFlash(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

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
                Editor de campeonatos
              </h2>
              <p className="mt-1 text-sm text-ppb-muted">
                Crie, edite e remova campeonatos. Cada um aparece automaticamente em /campeonatos e nas páginas dos jogos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startNew}
            disabled={editingId === "new"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ppb-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo campeonato
          </button>
        </div>

        {flash ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            <Check className="h-3.5 w-3.5" />
            {flash}
          </div>
        ) : null}
      </div>

      {/* FORM */}
      {editingId !== null ? (
        <TournamentFormCard
          form={form}
          isNew={editingId === "new"}
          saving={saving}
          error={error}
          onChange={setField}
          onSave={save}
          onCancel={cancel}
        />
      ) : null}

      {/* MOCK (read-only) */}
      <Section title="Padrão do sistema" subtitle={`${MOCK_TOURNAMENTS.length} mock — não-editáveis (vivem em código)`}>
        <ul className="grid gap-3 md:grid-cols-2">
          {MOCK_TOURNAMENTS.map((t) => (
            <TournamentMiniCard
              key={t.id}
              tournament={t}
              readOnly
              matchesHref={`${matchesBaseHref}/${t.id}/matches`}
            />
          ))}
        </ul>
      </Section>

      {/* SERVER (editáveis) */}
      <Section
        title="Criados pelo admin"
        subtitle={
          loading
            ? "Carregando..."
            : `${serverList.length} no servidor — editáveis e removíveis`
        }
      >
        {!loading && serverList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ppb-border bg-ppb-subtle/40 p-8 text-center">
            <Trophy className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
            <p className="mt-3 text-sm text-ppb-muted">
              Nenhum campeonato criado ainda. Clique em <strong>Novo campeonato</strong> pra começar.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {serverList.map((t) => (
              <TournamentMiniCard
                key={t.id}
                tournament={t}
                onEdit={() => startEdit(t)}
                onDelete={() => remove(t.id)}
                matchesHref={`${matchesBaseHref}/${t.id}/matches`}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-black uppercase text-ppb-text">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-ppb-muted">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function TournamentMiniCard({
  tournament,
  readOnly,
  onEdit,
  onDelete,
  matchesHref
}: {
  tournament: MockTournament;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  matchesHref?: string;
}) {
  const game = getGameBySlug(tournament.gameSlug);
  const statusTone =
    tournament.status === "open" ? "open" : tournament.status === "live" ? "live" : "finished";

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-ppb-border bg-ppb-subtle/40 p-3">
      <div
        className="h-12 w-12 shrink-0 rounded-xl bg-cover bg-center ring-1 ring-ppb-border"
        style={{ backgroundImage: game ? `url(${game.coverImage})` : undefined }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-ppb-text">{tournament.name}</div>
            <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
              {game?.name ?? tournament.gameSlug}
            </div>
          </div>
          <StatusBadge tone={statusTone} size="sm" />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ppb-muted">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3 text-ppb-mutedSoft" />
            {formatDisplay(tournament.startDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3 text-ppb-mutedSoft" />
            {tournament.registered}/{tournament.maxPlayers}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3 text-ppb-gold" />
            {tournament.prize}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {matchesHref ? (
            <Link
              href={matchesHref}
              className="inline-flex items-center gap-1 rounded-lg border border-ppb-primary/40 bg-ppb-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-primary transition hover:bg-ppb-primary/20"
            >
              <Swords className="h-3 w-3" />
              Chaveamento
            </Link>
          ) : null}
          {!readOnly ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
              >
                <Edit3 className="h-3 w-3" />
                Editar
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-lg border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-rose-500/40 hover:text-rose-300"
              >
                <Trash2 className="h-3 w-3" />
                Apagar
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-ppb-subtle px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
              <Lock className="h-2.5 w-2.5" />
              Read-only
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function TournamentFormCard({
  form,
  isNew,
  saving,
  error,
  onChange,
  onSave,
  onCancel
}: {
  form: FormState;
  isNew: boolean;
  saving: boolean;
  error: string | null;
  onChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isValid = form.name.trim() && form.gameSlug && form.platform.trim() && form.prize.trim() && form.regionLabel.trim() && form.maxPlayers >= 2;

  return (
    <div className="rounded-3xl border border-ppb-primary/40 bg-ppb-surface p-6 shadow-ppb-glow">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isNew ? <Plus className="h-4 w-4 text-ppb-primary" /> : <Edit3 className="h-4 w-4 text-ppb-primary" />}
          <h3 className="font-display text-base font-black uppercase text-ppb-text">
            {isNew ? "Novo campeonato" : "Editar campeonato"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="grid h-8 w-8 place-items-center rounded-full text-ppb-mutedSoft hover:bg-ppb-subtle hover:text-ppb-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome do campeonato *" full>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            maxLength={80}
            placeholder="FC26 Pro Clubs Open"
            className="ppb-input"
          />
        </Field>

        <Field label="Jogo vinculado *">
          <select
            value={form.gameSlug}
            onChange={(e) => onChange("gameSlug", e.target.value)}
            className="ppb-input"
          >
            {GAMES.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => onChange("status", e.target.value as Status)}
            className="ppb-input"
          >
            <option value="open">Inscrições abertas</option>
            <option value="live">Ao vivo</option>
            <option value="finished">Encerrado</option>
          </select>
        </Field>

        <Field label="Data e horário *">
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className="ppb-input"
          />
        </Field>

        <Field label="Formato">
          <select
            value={form.format}
            onChange={(e) => onChange("format", e.target.value as Format)}
            className="ppb-input"
          >
            <option value="eliminacao">Mata-mata</option>
            <option value="grupos">Grupos + mata-mata</option>
            <option value="pontos">Pontos corridos</option>
          </select>
        </Field>

        <Field label="Plataforma *">
          <input
            type="text"
            value={form.platform}
            onChange={(e) => onChange("platform", e.target.value)}
            maxLength={100}
            placeholder="PC, PlayStation 5, Mobile..."
            className="ppb-input"
          />
        </Field>

        <Field label="Região *">
          <input
            type="text"
            value={form.regionLabel}
            onChange={(e) => onChange("regionLabel", e.target.value)}
            maxLength={60}
            placeholder="Brasil, Sudeste, Nacional..."
            className="ppb-input"
          />
        </Field>

        <Field label="Premiação *">
          <input
            type="text"
            value={form.prize}
            onChange={(e) => onChange("prize", e.target.value)}
            maxLength={100}
            placeholder="R$ 1.000 + destaque oficial"
            className="ppb-input"
          />
        </Field>

        <Field label="Valor da inscrição">
          <input
            type="text"
            value={form.feeLabel}
            onChange={(e) => onChange("feeLabel", e.target.value)}
            placeholder="R$ 25,00 ou deixe vazio pra grátis"
            className="ppb-input"
          />
        </Field>

        <Field label="Limite de participantes *">
          <input
            type="number"
            min={2}
            value={form.maxPlayers}
            onChange={(e) => onChange("maxPlayers", Number(e.target.value))}
            className="ppb-input"
          />
        </Field>

        <Field label="Mínimo por time">
          <input
            type="number"
            min={1}
            value={form.minimumPlayers}
            onChange={(e) => onChange("minimumPlayers", Number(e.target.value))}
            className="ppb-input"
          />
        </Field>

        <Field label="Já inscritos">
          <input
            type="number"
            min={0}
            value={form.registered}
            onChange={(e) => onChange("registered", Number(e.target.value))}
            className="ppb-input"
          />
        </Field>

        <Field label="Descrição / regras resumidas" full>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Resumo do regulamento que aparece na página do campeonato."
            className="ppb-input"
          />
          <div className="mt-1 text-right text-[10px] text-ppb-mutedSoft">
            {form.description.length} / 500
          </div>
        </Field>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-borderStrong hover:text-ppb-text disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !isValid}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition",
            isValid
              ? "bg-ppb-primary hover:bg-ppb-primaryHover"
              : "bg-ppb-subtle text-ppb-muted shadow-none"
          )}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isNew ? "Criar campeonato" : "Salvar alterações"}
        </button>
      </div>

      <style jsx>{`
        :global(.ppb-input) {
          margin-top: 0.25rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background-color: rgba(17, 19, 26, 0.6);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: #ffffff;
        }
        :global(.ppb-input::placeholder) {
          color: rgba(255, 255, 255, 0.42);
        }
        :global(.ppb-input:focus) {
          outline: none;
          border-color: #FF6A00;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  full,
  children
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(full && "md:col-span-2")}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        {label}
      </label>
      {children}
    </div>
  );
}
