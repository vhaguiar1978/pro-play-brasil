import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, WalletMinimal, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PaymentReturnStatus } from "@/components/payment-return-status";

type Props = {
  searchParams: Promise<{
    status?: string;
    payment_id?: string;
    collection_id?: string;
  }>;
};

type Tone = "success" | "pending" | "failure" | "neutral";

function readTone(status: string | undefined): Tone {
  if (status === "success") return "success";
  if (status === "pending") return "pending";
  if (status === "failure") return "failure";
  return "neutral";
}

function readStatusLabel(status: string | undefined) {
  if (status === "success") return "Pagamento aprovado";
  if (status === "pending") return "Pagamento pendente";
  if (status === "failure") return "Pagamento não concluído";
  return "Retorno de pagamento";
}

function readStatusMessage(status: string | undefined) {
  if (status === "success") {
    return "Checkout concluído com sucesso. O saldo PPC será creditado automaticamente assim que o gateway confirmar.";
  }
  if (status === "pending") {
    return "Pagamento ficou pendente. Assim que o gateway aprovar, o sistema credita o saldo automaticamente — você não precisa fazer nada.";
  }
  if (status === "failure") {
    return "O pagamento não foi concluído. Pode tentar de novo quando quiser, sem custo de retentativa.";
  }
  return "Essa página recebe o retorno do gateway de pagamento e exibe o status.";
}

const TONE_CONFIG: Record<Tone, { bg: string; ring: string; text: string; icon: React.ReactNode; chip: string }> = {
  success: {
    bg: "from-emerald-500/15 via-ppb-surface to-ppb-surface",
    ring: "ring-emerald-500/40",
    text: "text-emerald-300",
    icon: <CheckCircle2 className="h-7 w-7" />,
    chip: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
  },
  pending: {
    bg: "from-amber-500/15 via-ppb-surface to-ppb-surface",
    ring: "ring-amber-500/40",
    text: "text-amber-300",
    icon: <Clock className="h-7 w-7" />,
    chip: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40"
  },
  failure: {
    bg: "from-rose-500/15 via-ppb-surface to-ppb-surface",
    ring: "ring-rose-500/40",
    text: "text-rose-300",
    icon: <XCircle className="h-7 w-7" />,
    chip: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40"
  },
  neutral: {
    bg: "from-ppb-accent/15 via-ppb-surface to-ppb-surface",
    ring: "ring-ppb-accent/40",
    text: "text-ppb-accent",
    icon: <WalletMinimal className="h-7 w-7" />,
    chip: "bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/40"
  }
};

export default async function PagamentoRetornoPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status;
  const paymentId = params.payment_id;
  const collectionId = params.collection_id;
  const tone = readTone(status);
  const cfg = TONE_CONFIG[tone];

  return (
    <div className="relative isolate min-h-[calc(100vh-64px)] overflow-hidden bg-ppb-background py-12 md:py-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/15 via-ppb-background to-ppb-background" />
      <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/20 blur-[140px]" />
      <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-accent/15 blur-[140px]" />

      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 md:px-6">
        <Link
          href="/arena/moedas"
          className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
        >
          <WalletMinimal className="h-3.5 w-3.5" /> Carteira PPC
        </Link>

        {/* HERO STATUS */}
        <div
          className={`relative overflow-hidden rounded-3xl border border-ppb-border bg-gradient-to-br p-6 ring-1 shadow-ppb-card md:p-8 ${cfg.bg} ${cfg.ring}`}
        >
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-current opacity-10 blur-3xl" />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ring-1 ${cfg.chip}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 space-y-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${cfg.chip}`}>
                Pagamentos
              </span>
              <h1 className="font-display text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
                {readStatusLabel(status)}
              </h1>
              <p className="text-sm leading-6 text-white/75">{readStatusMessage(status)}</p>
            </div>
          </div>
        </div>

        {/* DETAIL CARD */}
        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5 md:p-6">
          <PaymentReturnStatus status={status} paymentId={paymentId} collectionId={collectionId} />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/arena/moedas" variant="primary" className="justify-center">
            Voltar pra carteira
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/campeonatos" variant="ghost" className="justify-center">
            Ver campeonatos
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
