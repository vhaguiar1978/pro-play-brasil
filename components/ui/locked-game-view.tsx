import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Lock, Sparkles, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { InterestClickButton } from "@/components/ui/interest-click-button";
import type { Game } from "@/lib/games";

type Props = {
  game: Game;
  initialCount: number;
};

export function LockedGameView({ game, initialCount }: Props) {
  return (
    <div className="flex min-h-[80vh] flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      {/* HERO COM IMAGEM */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={game.heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover scale-110"
          />
          {/* Overlay mais escuro pra estado congelado */}
          <div className="absolute inset-0 bg-gradient-to-b from-ppb-background/70 via-ppb-background/90 to-ppb-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-ppb-background via-ppb-background/60 to-ppb-background/30" />
          <div
            className="absolute -left-32 top-1/3 h-96 w-96 rounded-full blur-[140px]"
            style={{ backgroundColor: `${game.themeColor}55` }}
          />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-6 md:pb-32 md:pt-8">
          <Link
            href="/jogos"
            className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-xs font-semibold text-ppb-muted backdrop-blur transition hover:border-ppb-primary/40 hover:bg-ppb-surface hover:text-ppb-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Todos os jogos
          </Link>

          <div className="mt-14 flex flex-col items-center gap-6 text-center md:mt-24">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <StatusBadge tone="soon">
                <Lock className="h-3 w-3" />
                Página congelada
              </StatusBadge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted backdrop-blur">
                <Gamepad2 className="h-3 w-3 text-ppb-primary" />
                Hub oficial
              </span>
            </div>

            <h1 className="max-w-4xl font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-6xl md:text-7xl lg:text-[6rem]">
              {game.name}
            </h1>

            <p className="max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              A modalidade ainda não está aberta para campeonatos. Demonstre seu interesse e ajude a gente
              a decidir quando abrir o primeiro torneio.
            </p>

            <div className="mt-4">
              <InterestClickButton
                gameSlug={game.slug}
                gameName={game.name}
                initialCount={initialCount}
                size="xl"
              />
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-ppb-mutedSoft">
              <Sparkles className="h-3.5 w-3.5 text-ppb-primary" />
              Quanto mais pedidos, mais rápido a gente abre os campeonatos
            </div>
          </div>
        </div>
      </section>

      {/* INFOBLOCK */}
      <section className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <FrozenInfo
            icon={<Lock className="h-5 w-5" />}
            title="Sem campeonatos ainda"
            description="A modalidade está visível, mas inscrições, ranking e tabela só abrem depois da liberação oficial."
          />
          <FrozenInfo
            icon={<Users className="h-5 w-5" />}
            title="Você decide"
            description="O contador de interesse é nosso parâmetro principal pra liberar o jogo."
          />
          <FrozenInfo
            icon={<Sparkles className="h-5 w-5" />}
            title="Avisamos no lançamento"
            description="Quem clicou recebe aviso direto quando o primeiro campeonato abrir."
          />
        </div>
      </section>
    </div>
  );
}

function FrozenInfo({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
        {icon}
      </div>
      <h3 className="mt-3 font-display text-sm font-black uppercase tracking-wider text-ppb-text">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-snug text-ppb-muted">{description}</p>
    </div>
  );
}
