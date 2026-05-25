import { ArrowRight, Gamepad2, Sparkles, Trophy, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { GameCard } from "@/components/ui/game-card";
import { IconInfoCard } from "@/components/ui/icon-info-card";
import { getMergedGames } from "@/lib/games-overrides-storage";
import { getTournamentsByGameSlug, MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";

export default async function JogosPage() {
  const allGames = await getMergedGames();
  // Esconde os "hidden", mantém active e frozen visíveis
  const games = allGames.filter((g) => g.runtimeStatus !== "hidden");
  const totalGames = games.length;
  const activeGames = games.filter((g) => g.runtimeStatus === "active").length;
  const totalTournaments = MOCK_TOURNAMENTS.length;
  const totalChampions = games.reduce((s, g) => s + g.champions.length, 0);

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

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-16">
          <div className="flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
              <Gamepad2 className="h-3 w-3" />
              Modalidades
            </div>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
              Escolha seu game.
              <br />
              <span className="text-ppb-primary">Entre na arena.</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Cada modalidade tem hub próprio com campeonatos, ranking e regras específicas. Clique no card pra explorar.
            </p>
          </div>

          {/* STATS */}
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <IconInfoCard tone="primary" icon={<Gamepad2 className="h-5 w-5" />} label="Modalidades" value={totalGames} />
            <IconInfoCard tone="accent" icon={<Sparkles className="h-5 w-5" />} label="Ativas" value={activeGames} hint={`${totalGames - activeGames} em breve`} />
            <IconInfoCard tone="primary" icon={<Users className="h-5 w-5" />} label="Campeonatos" value={totalTournaments} />
            <IconInfoCard highlight icon={<Trophy className="h-5 w-5" />} label="Campeões" value={totalChampions} hint="já consagrados" />
          </div>
        </div>
      </section>

      {/* GRID DE JOGOS */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              <Sparkles className="mr-1 inline h-3 w-3" />
              Disponíveis na plataforma
            </div>
            <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-[-0.02em] text-white md:text-4xl">
              Todos os jogos
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => {
            const tournaments = getTournamentsByGameSlug(game.slug);
            return (
              <GameCard
                key={game.slug}
                name={game.name}
                slug={game.slug}
                image={game.coverImage}
                shortDescription={game.shortDescription}
                status={game.runtimeStatus === "active" ? "active" : "soon"}
                tournamentCount={tournaments.length}
              />
            );
          })}
        </div>
      </section>

      {/* SUGESTÃO */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-ppb-accent/30 bg-gradient-to-br from-ppb-accent/15 via-ppb-surface to-ppb-surface p-6 shadow-ppb-glow-cyan md:p-8">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-ppb-accent/25 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/40">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black uppercase text-ppb-text md:text-2xl">
                  Seu jogo não está aqui?
                </h3>
                <p className="mt-1 text-sm text-ppb-muted">
                  Sugira na home — quanto mais gente pedir, mais rápido a gente abre.
                </p>
              </div>
            </div>
            <ButtonLink href="/#sugestao" variant="secondary" size="lg" className="shrink-0">
              Sugerir jogo
              <ArrowRight className="ml-1 h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
