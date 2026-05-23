"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  ShieldCheck,
  Trophy,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { TournamentParticipants } from "@/components/tournament-participants";
import { TournamentStructure } from "@/components/tournament-structure";
import { getGameBySlug } from "@/lib/games";
import { getMockStructure } from "@/lib/mock-structure";
import { formatLabel, getTournamentById, type MockTournament } from "@/lib/mock-tournaments";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<MockTournament["status"], string> = {
  open: "Inscrições abertas",
  live: "Ao vivo",
  finished: "Finalizado"
};

const STATUS_TONE: Record<MockTournament["status"], string> = {
  open: "bg-ppb-primary text-white",
  live: "bg-emerald-500 text-white",
  finished: "bg-white/95 text-ppb-text"
};

export default function CampeonatoPage({ params }: Props) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<MockTournament | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTournament(getTournamentById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) return null;
  if (!tournament) notFound();

  const game = getGameBySlug(tournament.gameSlug);
  const structure = getMockStructure(tournament.format, tournament.id, tournament.maxPlayers);
  const date = new Date(tournament.startDate);
  const heroImage = game?.heroImage ?? game?.coverImage;
  const gallery = game?.gallery ?? [];
  const isOpen = tournament.status === "open";

  return (
    <div className="flex flex-col gap-12 pb-20 md:gap-16 md:pb-28">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {heroImage ? (
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-ppb-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 md:px-6 md:pb-20 md:pt-10">
          <Link
            href="/campeonatos"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Campeonatos
          </Link>

          <div className="mt-12 flex flex-col gap-6 md:mt-20">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_TONE[tournament.status]}`}>
                {STATUS_LABEL[tournament.status]}
              </span>
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {tournament.origin === "official" ? "Oficial Pro Play" : "Comunidade"}
              </span>
              {game ? (
                <Link
                  href={`/jogos/${game.slug}`}
                  className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {game.name}
                </Link>
              ) : null}
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.03em] text-white drop-shadow-lg md:text-6xl">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap gap-3 pt-2">
              {isOpen ? (
                <ButtonLink href={`/campeonatos/${tournament.id}/inscricao`} size="lg">
                  Inscrever-se {tournament.feeLabel ? `· ${tournament.feeLabel}` : "· Grátis"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur">
                  <ShieldCheck className="h-4 w-4" />
                  {tournament.status === "live" ? "Inscrições encerradas" : "Campeonato finalizado"}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-4 grid w-full max-w-7xl gap-3 px-4 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        <InfoTile icon={<Calendar className="h-5 w-5" />} label="Data">
          {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
        </InfoTile>
        <InfoTile icon={<Clock className="h-5 w-5" />} label="Horário">
          {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </InfoTile>
        <InfoTile icon={<Users className="h-5 w-5" />} label="Vagas">
          {tournament.registered}/{tournament.maxPlayers}
        </InfoTile>
        <InfoTile icon={<Trophy className="h-5 w-5" />} label="Prêmio" highlight>
          <span className="truncate">{tournament.prize}</span>
        </InfoTile>
      </section>

      {gallery.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <h2 className="mb-5 text-2xl font-black text-ppb-text">Galeria do jogo</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {gallery.map((src) => (
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
      ) : null}

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
            <h2 className="text-xl font-black text-ppb-text">Sobre</h2>
            <p className="mt-3 text-sm leading-7 text-ppb-muted">
              {tournament.description ||
                `Campeonato de ${game?.name ?? tournament.gameSlug} na plataforma Pro Play Brasil.`}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              <Meta label="Formato">{formatLabel(tournament.format)}</Meta>
              <Meta label="Plataforma" icon={<Monitor className="h-3.5 w-3.5" />}>
                {tournament.platform}
              </Meta>
              <Meta label="Região" icon={<MapPin className="h-3.5 w-3.5" />}>
                {tournament.regionLabel}
              </Meta>
              {tournament.minimumPlayers ? (
                <Meta label="Mínimo por time">{tournament.minimumPlayers} jogadores</Meta>
              ) : null}
              <Meta label="Inscrição">{tournament.feeLabel ?? "Grátis"}</Meta>
            </dl>
          </div>

          <TournamentParticipants
            tournamentId={tournament.id}
            baseParticipants={tournament.participants}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primarySoft to-white p-6 shadow-ppb-card">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ppb-primary">
              {isOpen ? "Garantir vaga" : "Status"}
            </div>
            <div className="mt-3 text-3xl font-black text-ppb-text">
              {tournament.feeLabel ?? "Grátis"}
            </div>
            <div className="mt-1 text-sm text-ppb-muted">
              {tournament.registered}/{tournament.maxPlayers} vagas preenchidas
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-ppb-border">
              <div
                className="h-full bg-ppb-primary transition-all"
                style={{
                  width: `${Math.min(100, (tournament.registered / tournament.maxPlayers) * 100)}%`
                }}
              />
            </div>

            {isOpen ? (
              <ButtonLink
                href={`/campeonatos/${tournament.id}/inscricao`}
                className="mt-6 w-full"
                size="lg"
              >
                Inscrever-se agora
                <ArrowRight className="ml-1 h-4 w-4" />
              </ButtonLink>
            ) : (
              <div className="mt-6 rounded-2xl bg-ppb-subtle p-4 text-center text-sm font-semibold text-ppb-muted">
                {tournament.status === "live" ? "Em andamento" : "Encerrado"}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card">
            <h3 className="text-lg font-black text-ppb-text">Regras rápidas</h3>
            <ul className="mt-4 space-y-3 text-sm text-ppb-muted">
              <li className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-ppb-primary" />
                Mínimo de {tournament.minimumPlayers ?? 1} jogadores confirmados por time.
              </li>
              <li className="flex gap-3">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-ppb-primary" />
                Campeão recebe {tournament.prize}.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ppb-primary" />
                Resultados validados pela administração.
              </li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <h2 className="mb-5 text-2xl font-black text-ppb-text">Tabela e chaveamento</h2>
          <TournamentStructure data={structure} />
        </div>
      </section>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  children,
  highlight
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-ppb-card ${
        highlight
          ? "border-ppb-primary/40 bg-gradient-to-br from-ppb-primarySoft to-white"
          : "border-ppb-border bg-ppb-surface"
      }`}
    >
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${highlight ? "text-ppb-primary" : "text-ppb-mutedSoft"}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 truncate text-lg font-black text-ppb-text">{children}</div>
    </div>
  );
}

function Meta({
  label,
  icon,
  children
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-ppb-mutedSoft">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-ppb-text">{children}</dd>
    </div>
  );
}
