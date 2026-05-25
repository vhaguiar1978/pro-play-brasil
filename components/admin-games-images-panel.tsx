"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Edit3,
  ImageIcon,
  Loader2,
  Upload,
  X
} from "lucide-react";
import { GAMES, type Game } from "@/lib/games";
import { cn } from "@/lib/utils";

type SlotKey = "cover" | "hero" | "gallery1" | "gallery2" | "gallery3";

type SlotDef = {
  key: SlotKey;
  label: string;
  hint: string;
  aspect: string;
  recommended: string;
};

const SLOTS: SlotDef[] = [
  {
    key: "cover",
    label: "Cover (card)",
    hint: "Capa vertical estilo Steam — aparece na Home e na listagem de jogos.",
    aspect: "aspect-[3/4]",
    recommended: "600 × 900"
  },
  {
    key: "hero",
    label: "Hero (banner)",
    hint: "Banner widescreen para o topo da página do jogo.",
    aspect: "aspect-[16/7]",
    recommended: "1920 × 620"
  },
  {
    key: "gallery1",
    label: "Galeria 1",
    hint: "Imagem grande de destaque na galeria.",
    aspect: "aspect-[16/10]",
    recommended: "1280 × 800"
  },
  {
    key: "gallery2",
    label: "Galeria 2",
    hint: "Screenshot ou arte secundária.",
    aspect: "aspect-[4/3]",
    recommended: "1280 × 960"
  },
  {
    key: "gallery3",
    label: "Galeria 3",
    hint: "Mais uma imagem para compor a atmosfera.",
    aspect: "aspect-[4/3]",
    recommended: "1280 × 960"
  }
];

type SlotState = { loading?: boolean; error?: string; flash?: string; v?: number };
type UploadState = Record<string, SlotState>;

export function AdminGamesImagesPanel({
  apiBase = "/api/admin/games"
}: {
  apiBase?: string;
} = {}) {
  const [selectedSlug, setSelectedSlug] = useState<string>(GAMES[0]?.slug ?? "");
  const [state, setState] = useState<UploadState>({});

  const selected = useMemo(() => GAMES.find((g) => g.slug === selectedSlug), [selectedSlug]);

  function setSlotState(slug: string, key: SlotKey, partial: SlotState) {
    setState((prev) => ({
      ...prev,
      [`${slug}:${key}`]: { ...prev[`${slug}:${key}`], ...partial }
    }));
  }

  async function handleUpload(slug: string, slot: SlotKey, file: File) {
    setSlotState(slug, slot, { loading: true, error: undefined, flash: undefined });
    const formData = new FormData();
    formData.append("slot", slot);
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBase}/${slug}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar imagem");
      }
      setSlotState(slug, slot, {
        loading: false,
        flash: "Imagem atualizada",
        v: Date.now()
      });
      setTimeout(() => {
        setSlotState(slug, slot, { flash: undefined });
      }, 3000);
    } catch (err) {
      setSlotState(slug, slot, {
        loading: false,
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  }

  return (
    <div className="text-ppb-text">
      {/* HEADER */}
      <div className="mb-6 rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-black uppercase text-ppb-text">
              Imagens dos jogos
            </h2>
            <p className="mt-1 text-sm text-ppb-muted">
              Faça upload da capa, banner e galeria de cada jogo. As imagens aparecem na Home,
              página do jogo e cards de campeonato.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong className="font-bold">Modo desenvolvimento.</strong> Em produção (Vercel), o upload precisa ir
            pro Supabase Storage. A rota{" "}
            <code className="rounded bg-amber-500/20 px-1 font-mono">/api/admin/games/[slug]/upload</code> hoje
            grava em <code className="rounded bg-amber-500/20 px-1 font-mono">/public/games/</code> — perfeito pra dev,
            precisa migrar pra deploy.
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        {/* LISTA DE JOGOS */}
        <aside className="rounded-3xl border border-ppb-border bg-ppb-surface p-3">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
            Selecione o jogo
          </div>
          <ul className="space-y-1">
            {GAMES.map((game) => (
              <li key={game.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(game.slug)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors",
                    selectedSlug === game.slug
                      ? "bg-ppb-primary/15 ring-1 ring-ppb-primary/40"
                      : "hover:bg-ppb-subtle/60"
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ppb-subtle ring-1 ring-ppb-border">
                    <Image
                      src={game.coverImage}
                      alt={game.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ppb-text">{game.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                      /{game.slug}
                    </div>
                  </div>
                  {selectedSlug === game.slug ? (
                    <Edit3 className="h-3.5 w-3.5 shrink-0 text-ppb-primary" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* PAINEL DE EDIÇÃO */}
        {selected ? (
          <section className="space-y-5">
            {/* PREVIEW DO CARD */}
            <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                    Preview live
                  </div>
                  <h3 className="font-display text-lg font-black uppercase text-ppb-text">
                    {selected.name}
                  </h3>
                </div>
                <a
                  href={`/jogos/${selected.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
                >
                  Abrir página do jogo →
                </a>
              </div>
              <CardPreview game={selected} version={state[`${selected.slug}:cover`]?.v} />
            </div>

            {/* GRID DE SLOTS */}
            <div className="grid gap-4 md:grid-cols-2">
              {SLOTS.map((slot) => {
                const slotState = state[`${selected.slug}:${slot.key}`] ?? {};
                return (
                  <SlotUploader
                    key={slot.key}
                    slug={selected.slug}
                    slot={slot}
                    game={selected}
                    state={slotState}
                    onPick={(file) => handleUpload(selected.slug, slot.key, file)}
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function SlotUploader({
  slug,
  slot,
  game,
  state,
  onPick
}: {
  slug: string;
  slot: SlotDef;
  game: Game;
  state: { loading?: boolean; error?: string; flash?: string; v?: number };
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Imagem default do slot
  const currentSrc = useMemo(() => {
    const v = state.v ? `?v=${state.v}` : "";
    switch (slot.key) {
      case "cover":
        return `/games/${slug}/cover.jpg${v}`;
      case "hero":
        return `/games/${slug}/hero.jpg${v}`;
      case "gallery1":
        return `/games/${slug}/gallery1.jpg${v}`;
      case "gallery2":
        return `/games/${slug}/gallery2.jpg${v}`;
      case "gallery3":
        return `/games/${slug}/gallery3.jpg${v}`;
    }
  }, [slug, slot.key, state.v]);

  function handleFile(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    onPick(file);
  }

  return (
    <div className="group rounded-2xl border border-ppb-border bg-ppb-surface p-4 transition-colors hover:border-ppb-borderStrong">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-ppb-text">{slot.label}</h4>
          <p className="mt-0.5 text-xs leading-snug text-ppb-muted">{slot.hint}</p>
        </div>
        <span className="rounded-full border border-ppb-border bg-ppb-subtle px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
          {slot.recommended}
        </span>
      </div>

      {/* PREVIEW DO SLOT */}
      <div
        className={cn(
          "relative mt-3 overflow-hidden rounded-xl border border-ppb-border bg-ppb-subtle",
          slot.aspect
        )}
      >
        <ImageWithFallback
          src={previewUrl ?? currentSrc}
          gameThemeColor={game.themeColor}
          slotLabel={slot.label}
        />
        {state.loading ? (
          <div className="absolute inset-0 grid place-items-center bg-ppb-background/70 backdrop-blur">
            <Loader2 className="h-6 w-6 animate-spin text-ppb-primary" />
          </div>
        ) : null}
      </div>

      {/* AÇÕES */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state.loading}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ppb-primary px-3 py-2 text-xs font-bold text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:cursor-wait disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          {state.loading ? "Enviando..." : "Trocar imagem"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* FEEDBACK */}
      {state.flash ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
          <Check className="h-3 w-3" />
          {state.flash}
        </div>
      ) : null}
      {state.error ? (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-500/10 px-2 py-1.5 text-[10px] font-bold text-rose-300 ring-1 ring-rose-500/30">
          <X className="mt-0.5 h-3 w-3 shrink-0" />
          {state.error}
        </div>
      ) : null}
    </div>
  );
}

function ImageWithFallback({
  src,
  gameThemeColor,
  slotLabel
}: {
  src: string;
  gameThemeColor: string;
  slotLabel: string;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div
        className="absolute inset-0 grid place-items-center"
        style={{
          background: `linear-gradient(135deg, ${gameThemeColor}40, transparent 60%), #0d1420`
        }}
      >
        <div className="flex flex-col items-center gap-1 text-ppb-mutedSoft">
          <ImageIcon className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Sem imagem</span>
          <span className="text-[9px] text-ppb-mutedSoft">{slotLabel}</span>
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setErrored(true)}
    />
  );
}

function CardPreview({ game, version }: { game: Game; version?: number }) {
  const v = version ? `?v=${version}` : "";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* MINI GAME CARD (3:4) */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-ppb-border bg-ppb-subtle">
        <ImageWithFallback
          src={`/games/${game.slug}/cover.jpg${v}`}
          gameThemeColor={game.themeColor}
          slotLabel="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ppb-background via-ppb-background/30 to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <div className="font-display text-xl font-black uppercase leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {game.name}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
            Como aparece na Home
          </div>
        </div>
      </div>

      {/* MINI HERO (16:7) */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-ppb-border bg-ppb-subtle sm:aspect-auto">
        <ImageWithFallback
          src={`/games/${game.slug}/hero.jpg${v}`}
          gameThemeColor={game.themeColor}
          slotLabel="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ppb-background via-ppb-background/40 to-transparent" />
        <div className="absolute inset-x-4 bottom-4">
          <div className="font-display text-2xl font-black uppercase leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {game.name}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
            Topo da página do jogo
          </div>
        </div>
      </div>
    </div>
  );
}
