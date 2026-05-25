import Link from "next/link";
import { ArrowLeft, Coins, Flame, ShieldCheck, Sparkles, WalletMinimal, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PpcShop } from "./ppc-shop";

export default function CarteiraComprarPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-ppb-background pb-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/15 via-ppb-background to-ppb-background" />
      <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[140px]" />
      <div className="absolute right-0 top-20 -z-10 h-96 w-96 rounded-full bg-ppb-accent/15 blur-[140px]" />

      <div className="mx-auto w-full max-w-5xl px-4 pt-8 md:px-6 md:pt-12">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao perfil
        </Link>

        {/* HERO */}
        <div className="mt-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/40 bg-ppb-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ppb-primary backdrop-blur">
            <WalletMinimal className="h-3 w-3" /> Carteira PPC
          </div>
          <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.02em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl">
            Recarregue
            <br />
            <span className="text-ppb-primary">seu saldo PPC.</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/75">
            PPC é a moeda interna do Pro Play Brasil. Use pra entrar em campeonatos pagos,
            personalizar seu perfil e mais. <strong className="text-ppb-text">PPC não é trocável por dinheiro real</strong>.
          </p>
        </div>

        {/* PACOTES */}
        <PpcShop />

        {/* FOOTER INFO */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <InfoCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Pagamento seguro"
            desc="Pix, cartão e boleto via Mercado Pago. Não armazenamos dados de cartão."
          />
          <InfoCard
            icon={<Zap className="h-4 w-4" />}
            title="Crédito instantâneo"
            desc="Pagou no Pix? PPC cai na sua conta em segundos."
          />
          <InfoCard
            icon={<Flame className="h-4 w-4" />}
            title="Sem mensalidade"
            desc="Compre só quando quiser jogar. Sem cobrança recorrente."
          />
        </div>

        <div className="mt-10 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90 md:p-6">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Aviso importante</span>
          </div>
          <p>
            PPC é <strong className="text-amber-200">moeda virtual de uso interno</strong> da plataforma Pro Play Brasil,
            sem valor monetário e não conversível em dinheiro. Use pra pagar inscrições em campeonatos,
            participar de palpites internos e desbloquear conteúdos exclusivos. Veja{" "}
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
