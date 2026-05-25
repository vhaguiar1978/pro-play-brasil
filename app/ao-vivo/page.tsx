import Link from "next/link";
import { ArrowRight, Radio, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LiveStreamsBoard } from "@/components/live/live-streams-board";

export default function AoVivoPage() {
  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      {/* HERO */}
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
              Quem está transmitindo agora pela Twitch. Use os filtros pra achar o jogo que você curte.
            </p>

            <Link
              href="/perfil/editar"
              className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-200 backdrop-blur transition hover:bg-rose-500/20"
            >
              <Radio className="h-4 w-4" />
              Quero transmitir também
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* BOARD */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <LiveStreamsBoard showHeader={false} />
      </section>
    </div>
  );
}
