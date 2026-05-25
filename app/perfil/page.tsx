"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Crown,
  Loader2,
  Search,
  Sparkles,
  User,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { readArenaProfile } from "@/lib/profile-storage";
import { GAMES } from "@/lib/games";
import { getRankingByGameSlug } from "@/lib/mock-rankings";

type Suggestion = {
  nick: string;
  gameName: string;
  gameSlug: string;
  pts: number;
};

const ALL_SUGGESTIONS: Suggestion[] = GAMES.flatMap((game) =>
  getRankingByGameSlug(game.slug).map((r) => ({
    nick: r.nick,
    gameName: game.name,
    gameSlug: game.slug,
    pts: r.pts
  }))
).sort((a, b) => b.pts - a.pts);

export default function PerfilIndexPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const profile = readArenaProfile();
    const nick = profile?.gamertag?.trim();
    if (nick) {
      setRedirecting(true);
      router.replace(`/perfil/${encodeURIComponent(nick)}`);
      return;
    }
    setChecking(false);
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_SUGGESTIONS.slice(0, 8);
    return ALL_SUGGESTIONS.filter(
      (s) =>
        s.nick.toLowerCase().includes(q) ||
        s.gameName.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/perfil/${encodeURIComponent(trimmed)}`);
  }

  if (checking || redirecting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-ppb-muted">
          <Loader2 className="h-5 w-5 animate-spin text-ppb-primary" />
          <span className="text-sm font-bold uppercase tracking-wider">
            {redirecting ? "Abrindo seu perfil..." : "Verificando..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/20 via-ppb-background to-ppb-background" />
        <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/30 blur-[140px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />

        <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-16">
          <div className="flex flex-col items-start gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Perfis competitivos
            </div>
            <h1 className="font-display text-4xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl">
              Encontre um jogador
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75">
              Digite o nick pra ver perfil, histórico de partidas e conquistas. Ou{" "}
              <Link href="/cadastrar" className="font-bold text-ppb-primary underline-offset-4 hover:underline">
                crie seu cadastro
              </Link>{" "}
              pra ter o seu.
            </p>

            {/* BUSCA */}
            <form onSubmit={submitSearch} className="w-full max-w-2xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ppb-mutedSoft" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nick (ex: BRZ_Kaique)"
                  autoFocus
                  className="w-full rounded-2xl border border-ppb-border bg-ppb-surface py-4 pl-12 pr-32 font-display text-lg font-black uppercase text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-ppb-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:opacity-50"
                >
                  Abrir perfil
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* SUGESTÕES */}
      <section className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              {query ? "Resultados" : "Em destaque"}
            </div>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
              {query ? `${filtered.length} jogadores` : "Top jogadores"}
            </h2>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ppb-border bg-ppb-surface/60 p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
            <p className="mt-3 text-sm text-ppb-muted">
              Nenhum jogador encontrado.{" "}
              <button
                type="button"
                onClick={submitSearch}
                className="font-bold text-ppb-primary hover:underline"
              >
                Abrir perfil “{query}” mesmo assim →
              </button>
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((s, idx) => {
              const isTop3 = idx < 3 && !query;
              return (
                <li key={`${s.nick}-${s.gameSlug}`}>
                  <Link
                    href={`/perfil/${encodeURIComponent(s.nick)}`}
                    className="group flex items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-surface p-4 transition-all hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:shadow-ppb-glow"
                  >
                    <PlayerAvatar
                      nick={s.nick}
                      position={isTop3 ? ((idx + 1) as 1 | 2 | 3) : undefined}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-ppb-text">{s.nick}</div>
                      <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
                        {s.gameName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-base font-black text-ppb-text">
                        {s.pts.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                        pts
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ppb-muted transition-transform group-hover:translate-x-1 group-hover:text-ppb-primary" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primary/15 via-ppb-surface to-ppb-surface p-6 shadow-ppb-glow md:p-8">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-ppb-primary/25 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/40">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black uppercase text-ppb-text md:text-2xl">
                  Quer o seu próprio perfil?
                </h3>
                <p className="mt-1 text-sm text-ppb-muted">
                  Crie sua conta e tenha avatar, win rate, histórico e medalhas.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ButtonLink href="/cadastrar" size="lg" className="shadow-ppb-glow-strong">
                Criar conta
                <ArrowRight className="ml-1 h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/entrar" variant="secondary" size="lg">
                <User className="mr-2 h-4 w-4" />
                Entrar
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
