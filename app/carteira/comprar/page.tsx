import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Coins,
  Flame,
  ShieldCheck,
  Sparkles,
  WalletMinimal,
  Zap
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PpcShop } from "./ppc-shop";

export default function CarteiraComprarPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-ppb-background pb-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/15 via-ppb-background to-ppb-background" />
      <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[140px]" />
      <div className="absolute right-0 top-20 -z-10 h-96 w-96 rounded-full bg-ppb-accent/15 blur-[140px]" />

      <div className="mx-auto w-full max-w-6xl px-4 pt-8 md:px-6 md:pt-12">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao perfil
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.02fr,0.98fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/40 bg-ppb-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ppb-primary backdrop-blur">
              <WalletMinimal className="h-3 w-3" /> Carteira PPC
            </div>
            <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.02em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl">
              Recarregue
              <br />
              <span className="text-ppb-primary">seu saldo PPC.</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75">
              PPC Ã© a moeda interna do Pro Play Brasil. Use pra entrar em campeonatos pagos,
              personalizar seu perfil e mais. <strong className="text-ppb-text">PPC nÃ£o Ã© trocÃ¡vel por dinheiro real</strong>.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <TopCard
                icon={<Coins className="h-4 w-4" />}
                label="Compra pontual"
                text="vocÃª recarrega sÃ³ quando quiser jogar"
                tone="primary"
              />
              <TopCard
                icon={<ShieldCheck className="h-4 w-4" />}
                label="SeguranÃ§a"
                text="checkout externo e fluxo claro de confirmaÃ§Ã£o"
                tone="accent"
              />
              <TopCard
                icon={<Flame className="h-4 w-4" />}
                label="ConversÃ£o"
                text="saldo rÃ¡pido para nÃ£o perder a vaga no campeonato"
                tone="gold"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                  Fluxo de compra
                </div>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
                  RÃ¡pido e simples
                </h2>
              </div>
              <div className="rounded-full border border-ppb-border bg-ppb-surface/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted">
                PPC imediato no Pix
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <FlowStep index="01" title="Escolha o pacote" detail="compare valor, bÃ´nus e o volume que faz sentido pra sua conta" />
              <FlowStep index="02" title="Abra o checkout" detail="pague com Pix, cartÃ£o ou boleto em ambiente seguro" />
              <FlowStep index="03" title="Receba o saldo" detail="use o PPC para campeonatos, palpites e recursos internos" />
            </div>

            <div className="mt-5 rounded-2xl border border-ppb-border bg-ppb-surface/70 p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-accent">
                <CalendarClock className="h-3.5 w-3.5" />
                O que esta tela precisa passar
              </div>
              <p className="mt-3 text-sm leading-6 text-ppb-muted">
                ConfianÃ§a, praticidade e velocidade. O usuÃ¡rio precisa entender em segundos quanto vai comprar, como pagar e quando o crÃ©dito cai.
              </p>
            </div>
          </div>
        </div>

        <PpcShop />

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <InfoCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Pagamento seguro"
            desc="Pix, cartÃ£o e boleto via Mercado Pago. NÃ£o armazenamos dados de cartÃ£o."
          />
          <InfoCard
            icon={<Zap className="h-4 w-4" />}
            title="CrÃ©dito instantÃ¢neo"
            desc="Pagou no Pix? PPC cai na sua conta em segundos."
          />
          <InfoCard
            icon={<Flame className="h-4 w-4" />}
            title="Sem mensalidade"
            desc="Compre sÃ³ quando quiser jogar. Sem cobranÃ§a recorrente."
          />
        </div>

        <div className="mt-10 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90 md:p-6">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Aviso importante</span>
          </div>
          <p>
            PPC Ã© <strong className="text-amber-200">moeda virtual de uso interno</strong> da plataforma Pro Play Brasil,
            sem valor monetÃ¡rio e nÃ£o conversÃ­vel em dinheiro. Use pra pagar inscriÃ§Ãµes em campeonatos,
            participar de palpites internos e desbloquear conteÃºdos exclusivos. Veja{" "}
            <Link href="/termos-de-uso" className="underline hover:text-amber-200">os termos completos</Link>.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <ButtonLink href="/perfil" variant="ghost">
            Voltar
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function TopCard({
  icon,
  label,
  text,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  tone: "primary" | "accent" | "gold";
}) {
  const toneClass = {
    primary: "text-ppb-primary",
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

function FlowStep({
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
      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-ppb-primary/30 bg-ppb-primary/10 text-sm font-black text-ppb-primary">
        {index}
      </div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs text-ppb-muted">{detail}</div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  desc
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-surface/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
          {icon}
        </span>
        <div className="text-sm font-bold text-ppb-text">{title}</div>
      </div>
      <p className="mt-2 text-xs leading-5 text-ppb-mutedSoft">{desc}</p>
    </div>
  );
}
