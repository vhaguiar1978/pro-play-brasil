"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  Settings,
  Unlock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES, type Game } from "@/lib/games";
import { StatusBadge } from "@/components/ui/status-badge";

type Status = "active" | "frozen" | "hidden";

type FormState = {
  name: string;
  shortDescription: string;
  themeColor: string;
  status: Status;
};

type Override = {
  name?: string;
  shortDescription?: string;
  themeColor?: string;
  status?: Status;
  updatedAt?: string;
};

type Props = {
  apiBase?: string;
};

export function AdminGamesEditorPanel({ apiBase = "/api/admin/games" }: Props = {}) {
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [flashes, setFlashes] = useState<Record<string, string | null>>({});
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, FormState>>({});

  // Carrega overrides existentes (via leitura indireta — vamos chamar 1 endpoint só pra GET)
  // Como não criamos GET, o admin sempre lê dos DEFAULTS + reload depois de cada save.
  // O endpoint POST retorna o estado completo, então atualizamos ali.

  // Inicializa form com defaults na primeira abertura
  useEffect(() => {
    const initial: Record<string, FormState> = {};
    for (const g of GAMES) {
      const ov = overrides[g.slug] ?? {};
      const defaultStatus: Status =
        g.status === "active" ? "active" : g.status === "hidden" ? "hidden" : "frozen";
      initial[g.slug] = {
        name: ov.name ?? g.name,
        shortDescription: ov.shortDescription ?? g.shortDescription,
        themeColor: ov.themeColor ?? g.themeColor,
        status: ov.status ?? defaultStatus
      };
    }
    setForms(initial);
  }, [overrides]);

  const setField = useCallback((slug: string, field: keyof FormState, value: string) => {
    setForms((p) => ({
      ...p,
      [slug]: { ...p[slug], [field]: value as never }
    }));
  }, []);

  async function saveGame(slug: string) {
    const form = forms[slug];
    if (!form) return;
    setLoading((p) => ({ ...p, [slug]: true }));
    setErrors((p) => ({ ...p, [slug]: null }));
    try {
      const r = await fetch(`${apiBase}/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          shortDescription: form.shortDescription,
          themeColor: form.themeColor,
          status: form.status
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao salvar");
      setOverrides(data.all ?? {});
      setFlashes((p) => ({ ...p, [slug]: "Alterações salvas" }));
      setTimeout(() => setFlashes((p) => ({ ...p, [slug]: null })), 2500);
    } catch (err) {
      setErrors((p) => ({ ...p, [slug]: err instanceof Error ? err.message : "Erro" }));
    } finally {
      setLoading((p) => ({ ...p, [slug]: false }));
    }
  }

  async function resetGame(slug: string) {
    if (!confirm(`Tem certeza? Vai descartar as alterações de ${slug} e voltar aos valores padrão.`)) return;
    setLoading((p) => ({ ...p, [slug]: true }));
    try {
      const r = await fetch(`${apiBase}/${slug}`, { method: "DELETE" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      setOverrides(data.all ?? {});
      setFlashes((p) => ({ ...p, [slug]: "Restaurado ao padrão" }));
      setTimeout(() => setFlashes((p) => ({ ...p, [slug]: null })), 2500);
    } catch (err) {
      setErrors((p) => ({ ...p, [slug]: err instanceof Error ? err.message : "Erro" }));
    } finally {
      setLoading((p) => ({ ...p, [slug]: false }));
    }
  }

  return (
    <div className="space-y-5 text-ppb-text">
      {/* HEADER */}
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-black uppercase text-ppb-text">
              Editor de jogos
            </h2>
            <p className="mt-1 text-sm text-ppb-muted">
              Edite nome, descrição, cor principal e status de cada modalidade. As mudanças aparecem
              imediatamente nas páginas do site.
            </p>
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {GAMES.map((game) => (
          <GameEditorRow
            key={game.slug}
            game={game}
            form={forms[game.slug]}
            override={overrides[game.slug]}
            isOpen={openSlug === game.slug}
            isLoading={!!loading[game.slug]}
            error={errors[game.slug] ?? null}
            flash={flashes[game.slug] ?? null}
            onToggle={() => setOpenSlug((p) => (p === game.slug ? null : game.slug))}
            onChange={(field, value) => setField(game.slug, field, value)}
            onSave={() => saveGame(game.slug)}
            onReset={() => resetGame(game.slug)}
          />
        ))}
      </div>
    </div>
  );
}

type RowProps = {
  game: Game;
  form?: FormState;
  override?: Override;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  flash: string | null;
  onToggle: () => void;
  onChange: (field: keyof FormState, value: string) => void;
  onSave: () => void;
  onReset: () => void;
};

function GameEditorRow({
  game,
  form,
  override,
  isOpen,
  isLoading,
  error,
  flash,
  onToggle,
  onChange,
  onSave,
  onReset
}: RowProps) {
  const hasOverride = override && Object.keys(override).length > 0;
  const currentStatus: Status = form?.status ?? "active";

  const isDirty = useMemo(() => {
    if (!form) return false;
    return (
      form.name !== (override?.name ?? game.name) ||
      form.shortDescription !== (override?.shortDescription ?? game.shortDescription) ||
      form.themeColor !== (override?.themeColor ?? game.themeColor) ||
      form.status !== (override?.status ??
        (game.status === "active" ? "active" : game.status === "hidden" ? "hidden" : "frozen"))
    );
  }, [form, override, game]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border bg-ppb-surface transition-colors",
        isOpen ? "border-ppb-primary/40" : "border-ppb-border"
      )}
    >
      {/* HEADER DA LINHA */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-ppb-border">
          <Image src={game.coverImage} alt="" fill sizes="48px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-black uppercase text-ppb-text">
              {form?.name ?? game.name}
            </span>
            {hasOverride ? (
              <span className="rounded-full bg-ppb-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-primary ring-1 ring-ppb-primary/40">
                editado
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
            /jogos/{game.slug}
          </div>
        </div>
        <StatusBadge
          tone={currentStatus === "active" ? "open" : currentStatus === "frozen" ? "soon" : "finished"}
          size="sm"
        >
          {currentStatus === "active" ? "Ativo" : currentStatus === "frozen" ? "Congelado" : "Oculto"}
        </StatusBadge>
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 transition-colors",
            isOpen
              ? "bg-ppb-primary text-white ring-ppb-primary/60"
              : "bg-ppb-subtle text-ppb-muted ring-ppb-border"
          )}
        >
          <Edit3 className="h-4 w-4" />
        </span>
      </button>

      {/* FORM EXPANDIDO */}
      {isOpen && form ? (
        <div className="border-t border-ppb-border bg-ppb-background/40 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* NOME */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                Nome do jogo *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                maxLength={80}
                className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 font-display text-sm font-black uppercase text-ppb-text focus:border-ppb-primary focus:outline-none"
              />
            </div>

            {/* COR PRINCIPAL */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                Cor principal
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={(e) => onChange("themeColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-xl border border-ppb-border bg-ppb-subtle"
                />
                <input
                  type="text"
                  value={form.themeColor}
                  onChange={(e) => onChange("themeColor", e.target.value)}
                  placeholder="#FF6A00"
                  className="flex-1 rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 font-mono text-sm uppercase text-ppb-text focus:border-ppb-primary focus:outline-none"
                />
              </div>
            </div>

            {/* DESCRIÇÃO CURTA */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                Descrição curta
              </label>
              <textarea
                value={form.shortDescription}
                onChange={(e) => onChange("shortDescription", e.target.value)}
                rows={2}
                maxLength={220}
                className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-sm text-ppb-text focus:border-ppb-primary focus:outline-none"
              />
              <div className="mt-1 text-right text-[10px] text-ppb-mutedSoft">
                {form.shortDescription.length} / 220
              </div>
            </div>

            {/* STATUS */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                Status da página
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <StatusOption
                  active={form.status === "active"}
                  onClick={() => onChange("status", "active")}
                  icon={<Unlock className="h-4 w-4" />}
                  title="Ativo"
                  description="Página completa, campeonatos abertos"
                  color="emerald"
                />
                <StatusOption
                  active={form.status === "frozen"}
                  onClick={() => onChange("status", "frozen")}
                  icon={<Lock className="h-4 w-4" />}
                  title="Congelado"
                  description="Só botão de interesse funciona"
                  color="cyan"
                />
                <StatusOption
                  active={form.status === "hidden"}
                  onClick={() => onChange("status", "hidden")}
                  icon={<EyeOff className="h-4 w-4" />}
                  title="Oculto"
                  description="Retorna 404 — não aparece no site"
                  color="rose"
                />
              </div>
            </div>
          </div>

          {/* FEEDBACK */}
          {error ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          ) : null}
          {flash ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              <Check className="h-3.5 w-3.5" />
              {flash}
            </div>
          ) : null}

          {/* AÇÕES */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <a
              href={`/jogos/${game.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
            >
              <Eye className="h-3 w-3" />
              Ver página
            </a>
            <div className="flex items-center gap-2">
              {hasOverride ? (
                <button
                  type="button"
                  onClick={onReset}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar padrão
                </button>
              ) : null}
              <button
                type="button"
                onClick={onSave}
                disabled={isLoading || !isDirty}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition",
                  isDirty
                    ? "bg-ppb-primary hover:bg-ppb-primaryHover"
                    : "bg-ppb-subtle text-ppb-muted shadow-none"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusOption({
  active,
  onClick,
  icon,
  title,
  description,
  color
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "emerald" | "cyan" | "rose";
}) {
  const COLOR = {
    emerald: {
      border: "border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      icon: "bg-emerald-500 text-white ring-emerald-500/60",
      title: "text-emerald-200"
    },
    cyan: {
      border: "border-ppb-accent/60 bg-ppb-accent/15 shadow-ppb-glow-cyan",
      icon: "bg-ppb-accent text-ppb-background ring-ppb-accent/60",
      title: "text-ppb-accent"
    },
    rose: {
      border: "border-rose-500/60 bg-rose-500/15 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
      icon: "bg-rose-500 text-white ring-rose-500/60",
      title: "text-rose-200"
    }
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-3 text-left transition-all",
        active
          ? COLOR.border
          : "border-ppb-border bg-ppb-surface hover:border-ppb-borderStrong"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1",
            active ? COLOR.icon : "bg-ppb-subtle text-ppb-muted ring-ppb-border"
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            active ? COLOR.title : "text-ppb-muted"
          )}
        >
          {title}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-ppb-muted">{description}</p>
    </button>
  );
}
