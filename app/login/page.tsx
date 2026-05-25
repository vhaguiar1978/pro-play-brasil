import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Sparkles,
  Trophy,
  User,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LoginForm } from "./login-form";

const PERKS = [
  {
    icon: <Trophy className="h-4 w-4" />,
    title: "Inscreva-se em campeonatos",
    desc: "Disputa de prêmios em dinheiro, PPC e brindes."
  },
  {
    icon: <Crown className="h-4 w-4" />,
    title: "Sobe no ranking",
    desc: "Acumule pontos por modalidade e vire referência."
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: "Monte seu time",
    desc: "Convide jogadores e dispute como equipe."
  }
];

export default function LoginPage() {
  return (
    <div className="relative isolate flex min-h-[calc(100vh-64px)] flex-col items-stretch justify-center overflow-hidden bg-ppb-background py-12 md:py-16">
      {/* BACKGROUND */}
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

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:px-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
        {/* COPY + BENEFÍCIOS */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Sua conta
          </div>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
            Bem-vindo
            <br />
            <span className="text-ppb-primary">de volta à arena.</span>
          </h1>
          <p className="max-w-md text-base leading-7 text-white/75">
            Entra com seu e-mail e senha pra acompanhar seus campeonatos, conquistas e ranking.
          </p>

          <ul className="hidden space-y-3 lg:block">
            {PERKS.map((p) => (
              <li key={p.title} className="flex items-start gap-3 rounded-2xl border border-ppb-border bg-ppb-surface/60 p-3 backdrop-blur">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
                  {p.icon}
                </span>
                <div>
                  <div className="text-sm font-bold text-ppb-text">{p.title}</div>
                  <div className="text-xs text-ppb-muted">{p.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* FORM */}
        <div className="rounded-3xl border border-ppb-primary/30 bg-ppb-surface p-6 shadow-ppb-glow md:p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase text-ppb-text">Entrar</h2>
              <p className="text-xs text-ppb-muted">Acesse com sua conta Pro Play</p>
            </div>
          </div>

          <LoginForm />

          {/* DIVIDER */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-ppb-border" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
              Primeira vez?
            </span>
            <div className="h-px flex-1 bg-ppb-border" />
          </div>

          <Link
            href="/cadastrar"
            className="group flex items-center justify-between gap-3 rounded-xl border border-ppb-border bg-ppb-subtle/60 p-4 transition-colors hover:border-ppb-primary/40 hover:bg-ppb-subtle"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold text-ppb-text">Criar conta grátis</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                  monte seu perfil em 1 min
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-ppb-muted transition-transform group-hover:translate-x-1 group-hover:text-ppb-primary" />
          </Link>
        </div>
      </div>

      {/* PERKS MOBILE */}
      <div className="mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 gap-3 px-4 md:px-6 lg:hidden">
        {PERKS.map((p) => (
          <div key={p.title} className="flex items-start gap-3 rounded-2xl border border-ppb-border bg-ppb-surface/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              {p.icon}
            </span>
            <div>
              <div className="text-sm font-bold text-ppb-text">{p.title}</div>
              <div className="text-xs text-ppb-muted">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
