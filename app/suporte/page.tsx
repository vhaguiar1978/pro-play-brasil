import {
  ArrowRight,
  Headphones,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ComplaintsWidget } from "@/components/complaints-widget";
import { supportCards } from "@/lib/site-content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// Número de suporte WhatsApp padrão (admin pode trocar via env futuramente)
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5511999999999";
const SUPPORT_EMAIL = "contato@proplaybrasil.com.br";

const ICONS = [ShieldCheck, Headphones, Trophy];

const TOPICS = [
  { icon: <Trophy className="h-4 w-4" />, label: "Campeonato" },
  { icon: <Users className="h-4 w-4" />, label: "Inscrição" },
  { icon: <ShieldCheck className="h-4 w-4" />, label: "Pagamento" },
  { icon: <LifeBuoy className="h-4 w-4" />, label: "Outro" }
];

export default function SuportePage() {
  const whatsappUrl = buildWhatsAppUrl(
    SUPPORT_WHATSAPP,
    "Olá, equipe Pro Play Brasil! Preciso de ajuda com:"
  );
  const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Suporte Pro Play Brasil")}`;

  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-accent/15 via-ppb-background to-ppb-background" />
        <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-accent/25 blur-[140px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-primary/20 blur-[140px]" />
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
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-accent/30 bg-ppb-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-accent backdrop-blur">
              <LifeBuoy className="h-3 w-3" />
              Suporte
            </div>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
              Precisa de ajuda?
              <br />
              <span className="text-ppb-primary">A gente resolve.</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75">
              Resposta direto no WhatsApp, e-mail ou abrindo um chamado pro time. Escolhe o canal mais rápido pra você.
            </p>

            {/* CTAs RÁPIDOS */}
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a
                href={emailUrl}
                className="inline-flex items-center gap-2 rounded-2xl border border-ppb-border bg-ppb-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-ppb-text transition hover:border-ppb-primary/40"
              >
                <Mail className="h-4 w-4" />
                E-mail
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CANAIS */}
      <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Canais de atendimento
          </div>
          <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.02em] text-white md:text-3xl">
            Escolha o melhor jeito de falar
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {supportCards.map((item, idx) => {
            const Icon = ICONS[idx] ?? ShieldCheck;
            return (
              <div
                key={item.title}
                className="relative isolate overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface p-6 transition-all hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:shadow-ppb-glow"
              >
                <div className="absolute -right-8 -top-8 -z-10 h-24 w-24 rounded-full bg-ppb-primary/15 blur-2xl" />
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/40">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-black uppercase text-ppb-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ppb-muted">{item.description}</p>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-xs">
                  <Phone className="h-3.5 w-3.5 text-ppb-primary" />
                  <span className="truncate font-bold text-ppb-text">{item.contact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TÓPICOS COMUNS */}
      <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-accent">
            Atalhos
          </div>
          <h2 className="mt-1 font-display text-xl font-black uppercase tracking-[-0.02em] text-white md:text-2xl">
            Sobre o que é?
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TOPICS.map((t) => (
            <a
              key={t.label}
              href={`${whatsappUrl}%20${encodeURIComponent(t.label)}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-surface p-4 transition-all hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:shadow-ppb-glow"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
                {t.icon}
              </span>
              <span className="flex-1 text-sm font-bold uppercase tracking-wider text-ppb-text">
                {t.label}
              </span>
              <ArrowRight className="h-4 w-4 text-ppb-muted transition-transform group-hover:translate-x-1 group-hover:text-ppb-primary" />
            </a>
          ))}
        </div>
      </section>

      {/* ABRIR CHAMADO */}
      <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primary/15 via-ppb-surface to-ppb-surface p-6 shadow-ppb-glow md:p-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ppb-primary/25 blur-3xl" />
          <div className="relative">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/40">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-black uppercase text-ppb-text md:text-2xl">
                  Abrir chamado
                </h2>
                <p className="mt-1 text-sm text-ppb-muted">
                  Vai direto pro painel administrativo com contexto da página. Boa pra problemas que precisam de revisão.
                </p>
              </div>
            </div>
            <ComplaintsWidget />
          </div>
        </div>
      </section>
    </div>
  );
}
