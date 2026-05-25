import Link from "next/link";
import { ArrowLeft, Compass, Gamepad2, Sparkles, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative isolate grid min-h-[calc(100vh-64px)] place-items-center overflow-hidden bg-ppb-background px-4 py-12">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/20 via-ppb-background to-ppb-background" />
      <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[140px]" />
      <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="mx-auto w-full max-w-xl space-y-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
          <Compass className="h-3 w-3" />
          Erro 404
        </div>

        <h1 className="font-display text-7xl font-black uppercase leading-[0.85] tracking-[-0.04em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-8xl">
          Página
          <br />
          <span className="text-ppb-primary">não encontrada.</span>
        </h1>

        <p className="mx-auto max-w-md text-base leading-7 text-white/75">
          A rota não existe ou foi movida. Pode ter sido um link antigo,
          uma URL digitada errada, ou conteúdo que saiu do ar.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" variant="primary" className="justify-center">
            <ArrowLeft className="h-4 w-4" />
            Voltar pro início
          </ButtonLink>
          <ButtonLink href="/campeonatos" variant="ghost" className="justify-center">
            Ver campeonatos
          </ButtonLink>
        </div>

        <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-2">
          <ShortcutCard href="/jogos" icon={<Gamepad2 className="h-4 w-4" />} label="Jogos" />
          <ShortcutCard href="/ranking" icon={<Trophy className="h-4 w-4" />} label="Ranking" />
          <ShortcutCard href="/login" icon={<Sparkles className="h-4 w-4" />} label="Entrar" />
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({
  href,
  icon,
  label
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-surface/60 p-3 backdrop-blur transition hover:border-ppb-primary/40 hover:bg-ppb-surface"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30 transition group-hover:bg-ppb-primary group-hover:text-ppb-background">
        {icon}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-ppb-mutedSoft transition group-hover:text-ppb-text">
        {label}
      </span>
    </Link>
  );
}
