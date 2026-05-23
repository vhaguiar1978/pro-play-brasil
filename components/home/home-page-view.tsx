import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Crown,
  Medal,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sword,
  Trophy,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { GAMES, getGameBySlug, getVisibleGames } from "@/lib/games";
import { getRankingByGameSlug } from "@/lib/mock-rankings";
import { MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";
import { differentials, homeStats, homeSteps, testimonials } from "@/lib/site-content";
import { publicRoutes } from "@/lib/public-routes";

type Props = {
  bodyFontClass: string;
  displayFontClass: string;
};

const CONTACT_EMAIL = "contato@proplaybrasil.com.br";
const featuredGameSlugs = ["fifa", "free-fire", "call-of-duty", "pubg"];
const gameHighlights = featuredGameSlugs
  .map((slug) => GAMES.find((game) => game.slug === slug))
  .filter((game): game is (typeof GAMES)[number] => Boolean(game));
const visibleGames = getVisibleGames();
const heroGame = visibleGames[0];
const featuredTournaments = MOCK_TOURNAMENTS.slice(0, 4);
const rankingLeaders = featuredGameSlugs
  .flatMap((slug) =>
    getRankingByGameSlug(slug)
      .slice(0, 1)
      .map((entry) => ({
        ...entry,
        game: getGameBySlug(slug)?.name ?? slug
      }))
  )
  .sort((a, b) => b.pts - a.pts)
  .slice(0, 4);

export function HomePageView({ bodyFontClass, displayFontClass }: Props) {
  const contactHref = `mailto:${CONTACT_EMAIL}?subject=Contato%20Pro%20Play%20Brasil`;

  return (
    <div className={`${bodyFontClass} bg-[#06070b] text-white`}>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.26),_transparent_28%),radial-gradient(circle_at_80%_18%,_rgba(71,162,255,0.18),_transparent_24%),linear-gradient(180deg,_#090A10_0%,_#05060A_54%,_#06070B_100%)]" />
        {heroGame ? (
          <div className="absolute inset-0 -z-10 opacity-35">
            <Image
              src={heroGame.heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(5,6,10,0.92)_8%,_rgba(5,6,10,0.78)_42%,_rgba(5,6,10,0.92)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(5,6,10,0.12)_0%,_rgba(5,6,10,0.72)_80%,_#06070b_100%)]" />
          </div>
        ) : null}

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-10 sm:pb-20 sm:pt-14 md:px-6 lg:grid-cols-[1.2fr,0.8fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-ppb-primary shadow-[0_0_20px_rgba(255,106,0,0.75)]" />
              Plataforma de campeonatos online
            </div>

            <div className="space-y-5">
              <h1
                className={`${displayFontClass} max-w-4xl text-4xl uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl md:text-6xl lg:text-7xl`}
              >
                Entre na arena dos campeonatos online da Pro Play Brasil.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/74 sm:text-lg">
                Uma plataforma premium para jogadores, times e organizadores disputarem eventos de FIFA, Free Fire,
                Call of Duty, PUBG e outras modalidades com ranking, premiacao, transmissao e operacao profissional.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={publicRoutes.tournaments} size="lg" className="min-w-[220px] shadow-[0_16px_40px_rgba(255,106,0,0.28)]">
                Ver campeonatos
                <ArrowRight className="ml-1 h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href={contactHref}
                variant="secondary"
                size="lg"
                className="min-w-[220px] border-white/14 bg-white/7 text-white backdrop-blur hover:border-white/28 hover:bg-white/12 hover:text-white"
              >
                Entrar em contato
                <MessageCircle className="ml-1 h-4 w-4" />
              </ButtonLink>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {homeStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.65rem] border border-white/10 bg-white/[0.06] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur"
                >
                  <div className={`${displayFontClass} text-3xl uppercase tracking-[-0.04em] text-white`}>
                    {item.value}
                  </div>
                  <div className="mt-2 text-sm text-white/58">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-[#0e1018]/88 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ppb-primary">
                      Arena online
                    </div>
                    <div className="mt-1 text-sm text-white/68">Operacao competitiva com foco em conversao e confianca</div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <Radio className="h-3.5 w-3.5" />
                    Campeonatos abertos
                  </span>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                {featuredTournaments.slice(0, 2).map((tournament) => {
                  const game = getGameBySlug(tournament.gameSlug);
                  const date = new Date(tournament.startDate);

                  return (
                    <Link
                      key={tournament.id}
                      href={`/campeonatos/${tournament.id}`}
                      className="group rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 transition hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/72">
                            {game?.name ?? tournament.gameSlug}
                          </div>
                          <h2 className="text-lg font-black leading-tight text-white">{tournament.name}</h2>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-right">
                          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                            Premio
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">{tournament.prize}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/62">
                        <InfoPill icon={<CalendarDays className="h-3.5 w-3.5" />}>
                          {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </InfoPill>
                        <InfoPill icon={<Users className="h-3.5 w-3.5" />}>
                          {tournament.registered}/{tournament.maxPlayers}
                        </InfoPill>
                        <InfoPill icon={<Trophy className="h-3.5 w-3.5" />}>
                          {tournament.feeLabel ?? "Gratis"}
                        </InfoPill>
                      </div>

                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ppb-primary">
                        Abrir campeonato
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/45">Modalidades</div>
                <div className="mt-3 space-y-3">
                  {gameHighlights.map((game) => (
                    <div key={game.slug} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      <div>
                        <div className="font-semibold text-white">{game.name}</div>
                        <div className="text-xs text-white/52">{game.status === "active" ? "Ativo na plataforma" : "Em breve"}</div>
                      </div>
                      <div className="h-2.5 w-2.5 rounded-full bg-ppb-primary shadow-[0_0_16px_rgba(255,106,0,0.78)]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/45">Pro Play Signal</div>
                <div className="mt-3 space-y-4">
                  <div>
                    <div className={`${displayFontClass} text-3xl uppercase tracking-[-0.04em] text-white`}>Premium</div>
                    <p className="mt-1 text-sm leading-7 text-white/60">
                      Estrutura para campeonatos com inscricao, controle, ranking e experiencia de marca.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {["Inscricao paga ou gratuita", "Ranking competitivo por jogo", "Espaco para transmissao e comunidade"].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                        <ShieldCheck className="h-4 w-4 text-ppb-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <SectionHeading
          eyebrow="Jogos em destaque"
          title="Modalidades com identidade propria e cara de arena competitiva."
          description="FIFA, Free Fire, Call of Duty e PUBG ganham destaque logo na entrada para mostrar variedade, autoridade e potencial de expansao da plataforma."
          theme="dark"
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {gameHighlights.map((game) => (
            <Link
              key={game.slug}
              href={`/jogos/${game.slug}`}
              className="group relative isolate overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#11131a] shadow-[0_20px_70px_rgba(0,0,0,0.32)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={game.coverImage}
                  alt={game.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,7,11,0.12),rgba(6,7,11,0.82)_72%,rgba(6,7,11,0.96)_100%)]" />
                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/76 backdrop-blur">
                    {game.status === "active" ? "Ativo" : "Em breve"}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ppb-primary backdrop-blur">
                    {getRankingByGameSlug(game.slug).length > 0 ? "Ranking" : "Hub"}
                  </span>
                </div>
                <div className="absolute inset-x-4 bottom-4 space-y-3">
                  <h3 className={`${displayFontClass} text-3xl uppercase leading-[0.92] tracking-[-0.04em] text-white`}>
                    {game.name}
                  </h3>
                  <p className="text-sm leading-7 text-white/62">{game.shortDescription}</p>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-ppb-primary">
                    Explorar modalidade
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#090b12]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading
            eyebrow="Campeonatos"
            title="Eventos que parecem grandes antes mesmo do primeiro jogo."
            description="A home agora empurra os torneios certos para conversao, com leitura rapida de status, premiacao, vagas e modalidade."
            theme="dark"
            actions={
              <ButtonLink href={publicRoutes.tournaments} variant="secondary" className="border-white/12 bg-white/6 text-white hover:border-white/24 hover:bg-white/10 hover:text-white">
                Todos os campeonatos
              </ButtonLink>
            }
          />

          <div className="mt-8 grid gap-5 xl:grid-cols-4">
            {featuredTournaments.map((tournament) => {
              const game = getGameBySlug(tournament.gameSlug);
              const date = new Date(tournament.startDate);

              return (
                <Link
                  key={tournament.id}
                  href={`/campeonatos/${tournament.id}`}
                  className="group overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#11131a] transition hover:-translate-y-1 hover:border-ppb-primary/35 hover:shadow-[0_22px_80px_rgba(255,106,0,0.12)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {game ? (
                      <Image
                        src={game.coverImage}
                        alt={game.name}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,7,11,0.2),rgba(6,7,11,0.82)_78%,rgba(6,7,11,0.96)_100%)]" />
                    <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/74 backdrop-blur">
                        {game?.name ?? tournament.gameSlug}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] ${
                          tournament.status === "open"
                            ? "bg-ppb-primary text-white"
                            : tournament.status === "live"
                              ? "bg-emerald-500 text-white"
                              : "bg-white/88 text-[#11131a]"
                        }`}
                      >
                        {tournament.status === "open" ? "Aberto" : tournament.status === "live" ? "Ao vivo" : "Finalizado"}
                      </span>
                    </div>
                    <div className="absolute inset-x-4 bottom-4">
                      <h3 className="text-xl font-black leading-tight text-white">{tournament.name}</h3>
                    </div>
                  </div>

                  <div className="grid gap-4 p-5">
                    <div className="grid grid-cols-3 gap-2 text-xs text-white/58">
                      <MetricMini label="Data">{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</MetricMini>
                      <MetricMini label="Vagas">
                        {tournament.registered}/{tournament.maxPlayers}
                      </MetricMini>
                      <MetricMini label="Entrada">{tournament.feeLabel ?? "Gratis"}</MetricMini>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/42">Premiacao</div>
                      <div className="mt-1 text-sm font-semibold text-white">{tournament.prize}</div>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-ppb-primary">
                      Ver detalhes
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#0f121b_0%,#0b0e15_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
            <SectionHeading
              eyebrow="Como funciona"
              title="Da inscricao ao ranking, o fluxo fica claro em poucos passos."
              description="A landing explica a jornada de forma simples para reduzir duvida, acelerar conversao e reforcar confianca."
              theme="dark"
            />

            <div className="mt-8 grid gap-4">
              {homeSteps.map((step, index) => (
                <div key={step.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start gap-4">
                    <div className={`${displayFontClass} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-ppb-primary/25 bg-ppb-primary/12 text-lg uppercase text-ppb-primary`}>
                      0{index + 1}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-white">{step.title}</h3>
                      <p className="text-sm leading-7 text-white/62">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.18),_transparent_28%),linear-gradient(180deg,#121621_0%,#0b0f17_100%)] p-6 sm:p-8">
              <div className="inline-flex rounded-full border border-ppb-primary/20 bg-ppb-primary/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ppb-primary">
                Premiacao
              </div>
              <div className={`${displayFontClass} mt-5 text-4xl uppercase tracking-[-0.05em] text-white sm:text-5xl`}>
                R$ 6.5k+
              </div>
              <p className="mt-3 text-sm leading-7 text-white/62">
                Estrutura pronta para premiacao em dinheiro, PPC, destaque oficial e campanhas especiais por modalidade.
              </p>
              <div className="mt-6 grid gap-3">
                {["Campeonatos gratuitos e pagos", "Premios em PPC e em reais", "Visual aspiracional para valorizar vencedores"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/72">
                    <Crown className="h-4 w-4 text-ppb-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#121621_0%,#0b0f17_100%)] p-6 sm:p-8">
              <div className="inline-flex rounded-full border border-sky-400/16 bg-sky-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-sky-300">
                Rankings
              </div>
              <div className="mt-5 space-y-4">
                {rankingLeaders.map((entry, index) => (
                  <div key={`${entry.game}-${entry.nick}`} className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-sm font-black text-white">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{entry.nick}</div>
                        <div className="text-xs uppercase tracking-[0.16em] text-white/42">{entry.game}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white">{entry.pts} pts</div>
                      <div className="text-xs text-white/46">{entry.wins} vitorias</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#121621_0%,#0b0f17_100%)] p-6 sm:col-span-2 sm:p-8">
              <div className="inline-flex rounded-full border border-emerald-400/16 bg-emerald-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Comunidade gamer
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
                <div className="grid gap-3">
                  {differentials.slice(0, 4).map((item) => (
                    <div key={item} className="flex gap-3 rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-white/66">
                      <Sword className="mt-1 h-4 w-4 shrink-0 text-ppb-primary" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="grid gap-3">
                  {testimonials.slice(0, 2).map((testimonial) => (
                    <div key={testimonial.name} className="rounded-[1.4rem] border border-white/10 bg-black/18 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ppb-primary/12 text-ppb-primary">
                          <Medal className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{testimonial.name}</div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/42">{testimonial.role}</div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-white/64">{testimonial.quote}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[linear-gradient(180deg,#0a0d13_0%,#07090d_100%)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.20),_transparent_30%),radial-gradient(circle_at_84%_28%,_rgba(71,162,255,0.14),_transparent_24%),linear-gradient(120deg,#111521_0%,#0c0f16_54%,#090b11_100%)] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.4)] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ppb-primary">
                  CTA final
                </div>
                <h2 className={`${displayFontClass} text-3xl uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl`}>
                  Monte seu time, escolha o jogo e entre agora no proximo campeonato.
                </h2>
                <p className="max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
                  A nova landing fecha a jornada com um convite direto para inscricao, reforco de credibilidade e CTA forte para transformar curiosidade em participacao real.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ButtonLink href={publicRoutes.joinChampionship} size="lg" className="w-full justify-center">
                  Entrar no campeonato
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href={publicRoutes.support}
                  variant="secondary"
                  size="lg"
                  className="w-full justify-center border-white/12 bg-white/7 text-white hover:border-white/24 hover:bg-white/12 hover:text-white"
                >
                  Falar com suporte
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2">
      <span className="text-ppb-primary">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function MetricMini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
      <div className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/38">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{children}</div>
    </div>
  );
}
