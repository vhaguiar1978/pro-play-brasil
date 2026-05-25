"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function SuggestGameCard({ className }: Props) {
  const [gameName, setGameName] = useState("");
  const [nick, setNick] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/interest/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName, nick, tag })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao enviar");
      setSuccess(true);
      setTotalCount(data.count);
      setTimeout(() => {
        setSuccess(false);
        setGameName("");
        setNick("");
        setTag("");
      }, 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-accent/15 via-ppb-background to-ppb-background"
      />
      <div className="absolute -left-20 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 rounded-full bg-ppb-accent/25 blur-[120px]" />
      <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-ppb-primary/20 blur-[120px]" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          {/* COPY */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-accent/30 bg-ppb-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-accent">
              <Sparkles className="h-3 w-3" />
              Sugestão de jogo
            </div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.02em] text-white sm:text-5xl md:text-6xl">
              Não achou seu jogo?
              <br />
              <span className="text-ppb-primary">A gente quer saber.</span>
            </h2>
            <p className="max-w-xl text-base leading-7 text-white/75">
              Manda o nome do jogo que você gostaria de disputar campeonato. Quanto mais gente pedir,
              mais rápido a gente abre.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-ppb-mutedSoft">
              <Gamepad2 className="h-3.5 w-3.5 text-ppb-primary" />
              Apex Legends, R6 Siege, Mortal Kombat... pode sugerir qualquer um.
            </div>
          </div>

          {/* FORM */}
          <div className="rounded-3xl border border-ppb-primary/30 bg-ppb-surface p-6 shadow-ppb-glow md:p-8">
            {success ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/40">
                  <Check className="h-8 w-8 text-emerald-300" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-black uppercase text-ppb-text">
                  Recebido!
                </h3>
                <p className="mt-2 text-sm text-ppb-muted">
                  {totalCount !== null ? (
                    <>
                      Já temos <strong className="text-ppb-primary">{totalCount}</strong> sugestões de jogos.
                    </>
                  ) : (
                    "A gente vai analisar e voltar pra você."
                  )}
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    Nome do jogo *
                  </label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    required
                    maxLength={60}
                    placeholder="ex: Apex Legends"
                    className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-3 font-display text-lg font-black uppercase text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      placeholder="ex: ProGamer420"
                      className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-sm font-bold text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                      Tag / contato
                    </label>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      maxLength={80}
                      placeholder="@instagram, discord ou e-mail"
                      className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !gameName.trim() || !nick.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-4 py-3.5 text-base font-bold text-white shadow-ppb-glow-strong transition hover:bg-ppb-primaryHover disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Quero ver esse jogo aqui
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
