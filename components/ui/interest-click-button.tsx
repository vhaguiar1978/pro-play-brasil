"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  gameSlug: string;
  gameName: string;
  initialCount: number;
  size?: "lg" | "xl";
  className?: string;
};

const STORAGE_KEY_PREFIX = "ppb_interest_click_";

export function InterestClickButton({ gameSlug, gameName, initialCount, size = "lg", className }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [alreadyClicked, setAlreadyClicked] = useState(false);
  const [nick, setNick] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const key = STORAGE_KEY_PREFIX + gameSlug;
    if (localStorage.getItem(key)) {
      setAlreadyClicked(true);
    }
  }, [gameSlug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/interest/games/${gameSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick, tag })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao registrar");
      setCount(data.count);
      setSuccess(true);
      localStorage.setItem(STORAGE_KEY_PREFIX + gameSlug, "1");
      setAlreadyClicked(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setNick("");
        setTag("");
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={cn("flex flex-col items-start gap-4 sm:flex-row sm:items-center", className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={alreadyClicked}
          className={cn(
            "group inline-flex items-center justify-center gap-2 rounded-2xl bg-ppb-primary font-bold text-white shadow-ppb-glow-strong transition-all duration-200 hover:bg-ppb-primaryHover hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-70",
            size === "xl" ? "px-8 py-5 text-lg" : "px-6 py-4 text-base"
          )}
        >
          {alreadyClicked ? (
            <>
              <Check className="h-5 w-5" />
              Interesse registrado
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Quero esse campeonato
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        {/* CONTADOR */}
        <div className="flex items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-surface px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft">
            Já querem
          </div>
          <div className="font-display text-3xl font-black uppercase text-ppb-primary">
            {count.toLocaleString("pt-BR")}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft">
            pessoas
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ppb-background/80 p-4 backdrop-blur"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-ppb-primary/40 bg-ppb-surface p-6 shadow-ppb-glow-strong"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-ppb-mutedSoft transition hover:bg-ppb-subtle hover:text-ppb-text disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            {success ? (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/40">
                  <Check className="h-8 w-8 text-emerald-300" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-black uppercase text-ppb-text">
                  Pronto!
                </h3>
                <p className="mt-2 text-sm text-ppb-muted">
                  Você é a <strong className="text-ppb-primary">{count}ª pessoa</strong> a pedir{" "}
                  <strong className="text-ppb-text">{gameName}</strong>. A gente vai te avisar quando abrir.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                    <Sparkles className="mr-1 inline h-3 w-3" />
                    Demonstrar interesse
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-black uppercase text-ppb-text">
                    {gameName}
                  </h3>
                  <p className="mt-2 text-sm text-ppb-muted">
                    Manda seu nick e a gente te avisa quando abrir o primeiro campeonato.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    Seu nick *
                  </label>
                  <input
                    type="text"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    maxLength={40}
                    autoFocus
                    placeholder="ex: ProGamer420"
                    className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-sm font-bold text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    Tag (Discord / Instagram / e-mail)
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    maxLength={80}
                    placeholder="ex: @progamer ou seu#1234"
                    className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                  />
                </div>

                {error ? (
                  <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !nick.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-4 py-3 text-sm font-bold text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Quero esse campeonato
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
