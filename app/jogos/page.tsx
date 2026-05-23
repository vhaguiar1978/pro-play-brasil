import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Trophy } from "lucide-react";
import { getVisibleGames } from "@/lib/games";
import { getTournamentsByGameSlug } from "@/lib/mock-tournaments";

const games = getVisibleGames();

export default function JogosPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-black tracking-tight text-ppb-text md:text-5xl">Jogos</h1>
        <p className="text-ppb-muted">Cada jogo tem sua página com campeonatos, regras e ranking.</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const tournaments = getTournamentsByGameSlug(game.slug);

          return (
            <Link
              key={game.slug}
              href={`/jogos/${game.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface shadow-ppb-card transition hover:-translate-y-1 hover:border-ppb-primary/40 hover:shadow-ppb-card-hover"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={game.coverImage}
                  alt={game.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      game.status === "active"
                        ? "bg-ppb-primary text-white"
                        : "bg-white/95 text-[#0F1115]"
                    }`}
                  >
                    {game.status === "active" ? "Ativo" : "Em breve"}
                  </span>
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ppb-text backdrop-blur">
                    {tournaments.length} campeonato{tournaments.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="absolute inset-x-4 bottom-4">
                  <h2 className="text-2xl font-black text-white drop-shadow-md">{game.name}</h2>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-center gap-2 text-sm text-ppb-text">
                  <Trophy className="h-4 w-4 text-ppb-primary" />
                  <span className="truncate font-medium">
                    {game.champions[0]?.name ?? "Sem campeão ainda"}
                  </span>
                </div>
                {game.status === "visible_locked" ? (
                  <div className="flex items-center gap-2 text-sm text-ppb-muted">
                    <Lock className="h-4 w-4" />
                    Inscrições em breve.
                  </div>
                ) : null}
                <div className="mt-auto flex items-center justify-between border-t border-ppb-border pt-4 text-sm font-bold text-ppb-primary">
                  Abrir hub
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
