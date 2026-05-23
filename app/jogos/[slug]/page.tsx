import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Lock, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getGameBySlug } from "@/lib/games";
import { getRankingByGameSlug } from "@/lib/mock-rankings";
import { getTournamentsByGameSlug } from "@/lib/mock-tournaments";

type Props = { params: Promise<{ slug: string }> };

export default async function JogoPage({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const tournaments = getTournamentsByGameSlug(game.slug);
  const ranking = getRankingByGameSlug(game.slug).slice(0, 10);
  const isLocked = game.status === "visible_locked";

  return (
    <div className="flex flex-col gap-12 pb-20 md:gap-16 md:pb-28">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={game.heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-ppb-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-10">
          <Link
            href="/jogos"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            ← Jogos
          </Link>

          <div className="mt-12 max-w-3xl space-y-5 md:mt-20">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
              {isLocked ? "Em breve" : "Ativo"}
            </span>
            <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.03em] text-white drop-shadow-lg md:text-6xl">
              {game.name}
            </h1>
            <p className="max-w-2xl text-lg text-white/85 drop-shadow">{game.shortDescription}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href={isLocked ? "/suporte" : "/campeonatos"} size="lg">
                {isLocked ? "Avisar quando abrir" : "Ver campeonatos"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/ranking"
                variant="secondary"
                size="lg"
                className="border-white/40 bg-white/10 text-white backdrop-blur hover:border-white/60 hover:bg-white/20"
              >
                Ver ranking
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <h2 className="mb-5 text-2xl font-black text-ppb-text">Galeria do jogo</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {game.gallery.map((src) => (
            <div
              key={src}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-ppb-border bg-ppb-subtle shadow-ppb-card"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-ppb-text md:text-3xl">Campeonatos</h2>
          <Link href="/campeonatos" className="text-sm font-semibold text-ppb-primary hover:underline">
            Todos
          </Link>
        </div>

        {tournaments.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => {
              const date = new Date(tournament.startDate);
              return (
                <Link
                  key={tournament.id}
                  href={`/campeonatos/${tournament.id}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card transition hover:-translate-y-1 hover:border-ppb-primary/40 hover:shadow-ppb-card-hover"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={game.coverImage}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        tournament.status === "open"
                          ? "bg-ppb-primary text-white"
                          : tournament.status === "live"
                            ? "bg-emerald-500 text-white"
                            : "bg-white/95 text-[#0F1115]"
                      }`}
                    >
                      {tournament.status === "open" ? "Aberto" : tournament.status === "live" ? "Ao vivo" : "Finalizado"}
                    </span>
                    <h3 className="absolute inset-x-4 bottom-4 text-xl font-black text-white drop-shadow-md">
                      {tournament.name}
                    </h3>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center gap-2 text-sm text-ppb-muted">
                      <Calendar className="h-4 w-4 text-ppb-primary" />
                      {date.toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-ppb-muted">
                      <Trophy className="h-4 w-4 text-ppb-primary" />
                      {tournament.prize}
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-ppb-border pt-4">
                      <span className="text-sm font-semibold text-ppb-muted">
                        {tournament.feeLabel ?? "Grátis"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-ppb-primary">
                        Ver
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-ppb-border bg-ppb-surface px-6 py-12 text-center">
            <Lock className="h-8 w-8 text-ppb-mutedSoft" />
            <p className="text-ppb-muted">Nenhum campeonato ativo ainda.</p>
          </div>
        )}
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <h2 className="text-xl font-black text-ppb-text">Regras</h2>
          <ul className="mt-5 space-y-3 text-sm text-ppb-muted">
            {game.rules.map((rule, idx) => (
              <li key={rule} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ppb-primarySoft text-xs font-bold text-ppb-primary">
                  {idx + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-ppb-text">Top 10</h2>
            <Link href="/ranking" className="text-sm font-semibold text-ppb-primary hover:underline">
              Ver ranking
            </Link>
          </div>
          {ranking.length > 0 ? (
            <ol className="mt-5 space-y-2">
              {ranking.map((entry) => (
                <li
                  key={entry.nick}
                  className="flex items-center justify-between rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ppb-primary/10 text-xs font-black text-ppb-primary">
                      {entry.pos}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-ppb-text">{entry.nick}</div>
                      <div className="truncate text-xs text-ppb-muted">
                        {entry.city} · {entry.uf}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-ppb-text">{entry.pts} pts</div>
                    <div className="text-xs text-ppb-muted">{entry.wins} vitórias</div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-ppb-muted">Sem ranking ainda.</p>
          )}
        </div>
      </section>

      {game.champions.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <h2 className="mb-5 text-2xl font-black text-ppb-text">Campeões</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {game.champions.map((champion) => (
              <div
                key={`${champion.season}-${champion.name}`}
                className="rounded-2xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ppb-primary">
                  {champion.season}
                </div>
                <div className="mt-2 text-xl font-bold text-ppb-text">{champion.name}</div>
                <div className="mt-1 text-sm text-ppb-muted">{champion.title}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
