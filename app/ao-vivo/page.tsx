import Link from "next/link";
import { ArrowRight, CalendarClock, Crown, Radio, Sparkles, Tv, Users } from "lucide-react";
import { LiveStreamsBoard } from "@/components/live/live-streams-board";

export default function AoVivoPage() {
  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-500/15 via-ppb-background to-ppb-background" />
        <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-rose-500/25 blur-[140px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-primary/20 blur-[140px]" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-16">
          <div className="grid gap-8 lg:grid-cols-[1.04fr,0.96fr]">
            <div className="flex flex-col items-start gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400 shadow-[0_0_8px_currentColor]" />
                No ar agora
              </div>
              <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
                Ao vivo na
                <br />
                <span className="text-rose-300">Pro Play Brasil.</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/75">
                Quem estÃ¡ transmitindo agora pela Twitch. Use os filtros pra achar o jogo que vocÃª curte e acompanhe a arena em tempo real.
              </p>

              <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                <LiveHeroCard
                  icon={<Tv className="h-4 w-4" />}
                  label="Vitrine ao vivo"
                  text="streams oficiais e comunitÃ¡rias no mesmo hub"
                  tone="rose"
                />
                <LiveHeroCard
                  icon={<Users className="h-4 w-4" />}
                  label="RetenÃ§Ã£o"
                  text="quem assiste tambÃ©m volta para ranking e campeonatos"
                  tone="accent"
                />
                <LiveHeroCard
                  icon={<Crown className="h-4 w-4" />}
                  label="PrestÃ­gio"
                  text="transmitir bem fortalece perfil e presenÃ§a da conta"
                  tone="gold"
                />
              </div>

              <Link
                href="/perfil/editar"
                className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-200 backdrop-blur transition hover:bg-rose-500/20"
              >
                <Radio className="h-4 w-4" />
                Quero transmitir tambÃ©m
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">
                    Grade ao vivo
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
                    Como usar bem
                  </h2>
                </div>
                <div className="rounded-full border border-ppb-border bg-ppb-surface/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted">
                  Atualiza automÃ¡tico
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <LiveStep index="01" title="Escolha a modalidade" detail="filtre rÃ¡pido pelos jogos com gente no ar" />
                <LiveStep index="02" title="Entre na stream" detail="acompanhe o narrador, o jogador e a partida em andamento" />
                <LiveStep index="03" title="Volte pro sistema" detail="depois da live, siga para ranking, perfil e inscriÃ§Ã£o" />
              </div>

              <div className="mt-5 rounded-2xl border border-ppb-border bg-ppb-surface/70 p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-accent">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Objetivo da tela
                </div>
                <p className="mt-3 text-sm leading-6 text-ppb-muted">
                  Transformar transmissÃ£o em retorno: quem entra pela live precisa descobrir jogadores, eventos e a prÃ³xima aÃ§Ã£o da plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <LiveStreamsBoard showHeader={false} />
      </section>
    </div>
  );
}

function LiveHeroCard({
  icon,
  label,
  text,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  tone: "rose" | "accent" | "gold";
}) {
  const toneClass = {
    rose: "text-rose-300",
    accent: "text-ppb-accent",
    gold: "text-ppb-gold"
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] ${toneClass}`}>
        {icon}
        {label}
      </div>
      <div className="mt-3 text-sm font-bold text-white">{text}</div>
    </div>
  );
}

function LiveStep({
  index,
  title,
  detail
}: {
  index: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="grid grid-cols-[auto,1fr] items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-surface/60 px-4 py-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-sm font-black text-rose-300">
        {index}
      </div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs text-ppb-muted">{detail}</div>
      </div>
    </div>
  );
}
