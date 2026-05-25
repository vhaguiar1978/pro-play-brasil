import Link from "next/link";
import {
  ArrowRight,
  Crown,
  Gamepad2,
  Sparkles,
  Trophy,
  User,
  Users,
  Zap
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CadastroArenaForm } from "./cadastro-arena-form";
import { publicRoutes } from "@/lib/public-routes";

const STEPS = [
  { num: 1, icon: <User className="h-4 w-4" />, title: "Crie seu perfil", desc: "Em menos de 1 minuto." },
  { num: 2, icon: <Gamepad2 className="h-4 w-4" />, title: "Escolha modalidade", desc: "FIFA, Free Fire, CoD..." },
  { num: 3, icon: <Trophy className="h-4 w-4" />, title: "Dispute prêmios", desc: "Dinheiro, PPC e brindes." }
];

export default function CadastroPage() {
  return (
    <div className="relative isolate flex flex-col gap-10 overflow-hidden bg-ppb-background pb-20 md:gap-14 md:pb-24">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/25 via-ppb-background to-ppb-background" />
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

        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-16">
          <div className="flex flex-col items-start gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Bem-vindo à arena
            </div>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
              Crie seu
              <br />
              <span className="text-ppb-primary">perfil gamer.</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75">
              Cadastro rápido pra entrar na disputa de campeonatos, subir no ranking e ganhar prêmios reais.
            </p>
            <Link
              href={publicRoutes.login}
              className="text-sm font-bold uppercase tracking-wider text-ppb-muted underline-offset-4 hover:text-ppb-text hover:underline"
            >
              Já tem conta? Entrar →
            </Link>
          </div>

          {/* STEPS */}
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="relative isolate overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface/60 p-4 backdrop-blur"
              >
                <div className="absolute -right-6 -top-6 -z-10 h-20 w-20 rounded-full bg-ppb-primary/20 blur-2xl" />
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/40">
                    {step.icon}
                  </span>
                  <div>
                    <div className="font-display text-xs font-black uppercase tracking-wider text-ppb-mutedSoft">
                      Passo {step.num}
                    </div>
                    <div className="text-sm font-bold text-ppb-text">{step.title}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-ppb-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORPO: FORM + LATERAL */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 md:px-6 lg:grid-cols-[1.3fr,0.7fr]">
        {/* FORM */}
        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase text-ppb-text">
                Sua identidade gamer
              </h2>
              <p className="text-xs text-ppb-muted">
                Preencha o cadastro abaixo. Você precisa só do essencial pra entrar.
              </p>
            </div>
          </div>

          <CadastroArenaForm />
        </div>

        {/* LATERAL */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-3xl border border-ppb-gold/30 bg-gradient-to-br from-ppb-gold/15 via-ppb-surface to-ppb-surface p-6 shadow-[0_0_40px_rgba(243,178,79,0.18)]">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-ppb-gold/25 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-ppb-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-gold ring-1 ring-ppb-gold/40">
                <Crown className="h-3 w-3" />
                Prêmios reais
              </div>
              <h3 className="mt-3 font-display text-2xl font-black uppercase text-white">
                R$ 32k+
              </h3>
              <p className="mt-1 text-sm text-ppb-muted">
                em prêmios já distribuídos pelos campeonatos da plataforma.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-black uppercase text-ppb-text">
              <Users className="h-4 w-4 text-ppb-primary" />
              Comunidade
            </h3>
            <div className="mt-4 space-y-3">
              <Bullet>
                <strong className="text-ppb-text">240+ times</strong> já cadastrados disputando.
              </Bullet>
              <Bullet>
                <strong className="text-ppb-text">68 campeonatos</strong> operados em FIFA, Free Fire, CoD, PUBG, Valorant e CS2.
              </Bullet>
              <Bullet>
                Ranking competitivo por modalidade.
              </Bullet>
            </div>
          </div>

          <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-black uppercase text-ppb-text">
              <Gamepad2 className="h-4 w-4 text-ppb-accent" />
              Já tem conta?
            </h3>
            <p className="mt-2 text-sm text-ppb-muted">
              Entra com seu e-mail e senha pra acessar seu perfil.
            </p>
            <ButtonLink href={publicRoutes.login} variant="secondary" className="mt-4 w-full">
              Fazer login
              <ArrowRight className="ml-1 h-4 w-4" />
            </ButtonLink>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs leading-snug text-ppb-muted">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ppb-primary shadow-[0_0_8px_currentColor]" />
      <span>{children}</span>
    </div>
  );
}
