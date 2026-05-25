"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  Flame,
  Gamepad2,
  Loader2,
  MessageCircle,
  Sparkles,
  Trophy,
  Users,
  WalletMinimal
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaywallModal } from "@/components/paywall-modal";
import { getGameBySlug } from "@/lib/games";
import { readArenaProfile } from "@/lib/profile-storage";
import { appendPpcLedgerEntry } from "@/lib/ppc-ledger";
import { readWallet, writeWallet } from "@/lib/wallet-storage";
import type { MockTournament } from "@/lib/mock-tournaments";

type Props = { params: Promise<{ id: string }> };

type PaymentMethod = "mercado_pago" | "pagseguro" | "ppc";

type PublicRegistration = {
  tournamentId: string;
  nickname: string;
  teamName: string;
  platform: string;
  paymentStatus: "free" | "paid";
  createdAt: string;
};

function parsePpcAmount(value: string | null) {
  if (!value) return 0;
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function parseBrlAmount(value: string | null) {
  if (!value) return 0;
  const match = value.match(/R\$\s*([\d.,]+)/i);
  if (!match) return 0;
  return Number.parseFloat(match[1].replace(/\./g, "").replace(",", ".")) || 0;
}

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Mobile", "Crossplay"] as const;

export default function InscricaoPage({ params }: Props) {
  const router = useRouter();
  const { id: tournamentId } = use(params);

  const [tournament, setTournament] = useState<MockTournament | null>(null);
  const [tournamentLoaded, setTournamentLoaded] = useState(false);
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const [nickname, setNickname] = useState("");
  const [teamName, setTeamName] = useState("");
  const [platform, setPlatform] = useState<string>("PC");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    bracketGenerated: boolean;
    nickname: string;
  } | null>(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercado_pago");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // ─── Tournament fetch ───
  useEffect(() => {
    let alive = true;
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const list = (data?.tournaments ?? []) as MockTournament[];
        setTournament(list.find((t) => t.id === tournamentId) ?? null);
      })
      .catch(() => alive && setTournament(null))
      .finally(() => alive && setTournamentLoaded(true));
    return () => {
      alive = false;
    };
  }, [tournamentId]);

  // ─── Registrations fetch (live count) ───
  const refreshRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
        cache: "no-store"
      });
      const data = await res.json();
      setRegistrations((data?.registrations ?? []) as PublicRegistration[]);
    } catch {
      /* ignora */
    }
  }, [tournamentId]);

  useEffect(() => {
    refreshRegistrations();
  }, [refreshRegistrations, refreshTick]);

  // Polling leve: refresh a cada 15s pra mostrar vagas em tempo real
  useEffect(() => {
    const t = setInterval(() => setRefreshTick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  // ─── Auto-fill do perfil local ───
  useEffect(() => {
    const profile = readArenaProfile();
    if (!profile) return;
    setNickname((prev) => prev || profile.gamertag);
    setPlatform((prev) => prev || profile.platform);
    setWhatsapp((prev) => prev || profile.whatsapp);
    if (tournament?.gameSlug) {
      setTeamName((prev) => prev || profile.teamByGame[tournament.gameSlug] || "");
    }
  }, [tournament?.gameSlug]);

  // ─── Derived ───
  const game = tournament ? getGameBySlug(tournament.gameSlug) : undefined;
  const heroImage = game?.heroImage ?? game?.coverImage;
  const feeLabel = tournament?.feeLabel ?? null;
  const requiresPayment = Boolean(feeLabel);
  const ppcFee = parsePpcAmount(feeLabel);
  const brlFee = parseBrlAmount(feeLabel);

  const liveCount = registrations.length;
  const max = tournament?.maxPlayers ?? 0;
  const vagasRestantes = Math.max(0, max - liveCount);
  const fillPct = max > 0 ? Math.min(100, (liveCount / max) * 100) : 0;
  const lotado = max > 0 && liveCount >= max;
  const inscricoesAbertas = tournament?.status === "open" && !lotado;

  const alreadyRegistered = useMemo(() => {
    const nick = nickname.trim().toLowerCase();
    if (!nick) return false;
    return registrations.some((r) => r.nickname.trim().toLowerCase() === nick);
  }, [registrations, nickname]);

  const providerDescription = useMemo(() => {
    if (paymentMethod === "mercado_pago") return "Checkout em reais com foco no Brasil.";
    if (paymentMethod === "pagseguro") return "Checkout alternativo para Pix e cartão.";
    return "Pagamento interno usando a carteira PPC.";
  }, [paymentMethod]);

  const checkoutPayload =
    requiresPayment && paymentMethod === "mercado_pago" && brlFee > 0 && tournament
      ? {
          kind: "tournament_fee" as const,
          title: `Inscrição — ${tournament.name}`,
          description: `Taxa de inscrição do campeonato ${tournament.name}`,
          quantity: 1,
          unitPrice: brlFee,
          externalReference: `tournament-${tournamentId}-${Date.now()}`,
          metadata: {
            tournament_id: tournamentId,
            nickname: nickname.trim(),
            team_name: teamName.trim(),
            platform: platform.trim(),
            whatsapp: whatsapp.trim()
          }
        }
      : undefined;

  function openPaymentFlow() {
    setError(null);
    if (!nickname.trim()) return setError("Preencha o nickname antes de abrir o pagamento.");
    if (!platform.trim()) return setError("Escolha sua plataforma antes de abrir o pagamento.");
    if (!whatsapp.trim()) return setError("Preencha o WhatsApp antes de abrir o pagamento.");
    setPaymentOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tournament) return;
    setError(null);

    const nick = nickname.trim();
    const team = teamName.trim();
    const plat = platform.trim();
    const wa = whatsapp.trim();

    if (!nick) return setError("Informe seu nickname.");
    if (!plat) return setError("Informe sua plataforma.");
    if (!wa) return setError("Informe seu WhatsApp para contato.");
    if (requiresPayment && !paymentConfirmed) {
      return setError("Confirme o pagamento antes de finalizar a inscrição.");
    }

    // Débito local de PPC quando o método é PPC (mantém compat com o sistema antigo)
    if (requiresPayment && paymentMethod === "ppc") {
      const wallet = readWallet();
      if (wallet.balance < ppcFee) {
        return setError(`Saldo insuficiente — precisa de ${ppcFee} PPC.`);
      }
      writeWallet({ balance: wallet.balance - ppcFee, updatedAt: new Date().toISOString() });
      appendPpcLedgerEntry({
        type: "tournament_fee",
        amount: ppcFee,
        direction: "out",
        source: tournamentId,
        note: `Inscrição em ${tournament.name}`
      });
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nickname: nick,
          teamName: team,
          platform: plat,
          whatsapp: wa,
          paymentMethod: requiresPayment ? paymentMethod : "free",
          paymentStatus: requiresPayment ? "paid" : "free"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Erro ao enviar inscrição.");
        return;
      }
      setSuccessInfo({
        bracketGenerated: Boolean(data?.bracketGenerated),
        nickname: nick
      });
      setRefreshTick((n) => n + 1);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!tournamentLoaded) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-ppb-background">
        <div className="flex items-center gap-3 text-ppb-mutedSoft">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando campeonato…
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-ppb-background px-4">
        <div className="max-w-md space-y-4 rounded-3xl border border-ppb-border bg-ppb-surface p-8 text-center">
          <Trophy className="mx-auto h-10 w-10 text-ppb-mutedSoft" />
          <h1 className="font-display text-2xl font-black uppercase text-ppb-text">
            Campeonato não encontrado
          </h1>
          <p className="text-sm text-ppb-mutedSoft">
            O link pode estar quebrado ou esse campeonato foi removido.
          </p>
          <ButtonLink href="/campeonatos" variant="primary">
            Ver todos os campeonatos
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (successInfo) {
    return (
      <SuccessScreen
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        heroImage={heroImage}
        bracketGenerated={successInfo.bracketGenerated}
        nickname={successInfo.nickname}
        liveCount={liveCount}
        max={max}
      />
    );
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-ppb-background pb-16">
      <PaywallModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onPaid={() => {
          setPaymentConfirmed(true);
          setPaymentOpen(false);
        }}
        title="Pagamento da inscrição"
        description={`Cobrança da inscrição em ${tournament.name}.`}
        priceLabel={feeLabel ?? "Grátis"}
        ruleNote={`Cobrança via ${paymentMethod === "mercado_pago" ? "Mercado Pago" : paymentMethod === "pagseguro" ? "PagSeguro" : "carteira PPC"}.`}
        ariaLabel="Pagamento da inscrição do campeonato"
        checkoutPayload={checkoutPayload}
      />

      {/* HERO BACKGROUND */}
      {heroImage ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ppb-background/50 via-ppb-background/85 to-ppb-background" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-br from-ppb-primary/20 via-ppb-background to-ppb-background" />
      )}
      <div className="pointer-events-none absolute -left-32 top-40 -z-10 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-20 -z-10 h-96 w-96 rounded-full bg-ppb-accent/15 blur-[140px]" />

      <div className="mx-auto w-full max-w-5xl px-4 pt-8 md:px-6 md:pt-12">
        {/* TOP NAV */}
        <Link
          href={`/campeonatos/${tournamentId}`}
          className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao campeonato
        </Link>

        {/* HERO COPY */}
        <div className="mt-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/40 bg-ppb-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ppb-primary backdrop-blur">
            <Sparkles className="h-3 w-3" /> Inscrição aberta
          </div>
          <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.02em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl">
            Garanta sua vaga em
            <br />
            <span className="text-ppb-primary">{tournament.name}</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/75">
            Preencha seu nick e WhatsApp. Assim que a última vaga for preenchida, o chaveamento
            é gerado <strong className="text-ppb-text">automaticamente</strong>.
          </p>
        </div>

        {/* VAGAS LIVE */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <LiveStatCard
            icon={<Users className="h-4 w-4" />}
            label="Vagas restantes"
            value={lotado ? "0" : String(vagasRestantes)}
            hint={lotado ? "Chaveamento completo" : `${liveCount} de ${max} inscritos`}
            tone={lotado ? "danger" : vagasRestantes <= 2 ? "warn" : "ok"}
          />
          <LiveStatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Premiação"
            value={tournament.prize}
            hint="Distribuída entre os campeões"
            tone="gold"
          />
          <LiveStatCard
            icon={feeLabel ? <Coins className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
            label={feeLabel ? "Inscrição" : "Entrada"}
            value={feeLabel ?? "Grátis"}
            hint={feeLabel ? "Pago no checkout abaixo" : "Sem taxa"}
            tone={feeLabel ? "accent" : "ok"}
          />
        </div>

        {/* PROGRESSO */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface/80 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft">
            <span>Preenchimento do chaveamento</span>
            <span className="font-mono text-ppb-text">
              {liveCount}/{max}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ppb-background ring-1 ring-ppb-border">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                lotado ? "bg-rose-500" : fillPct > 80 ? "bg-amber-400" : "bg-ppb-primary"
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          {/* FORM */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* PAGAMENTO (se houver taxa) */}
            {requiresPayment ? (
              <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/30">
                      <WalletMinimal className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-accent">
                        Pagamento
                      </div>
                      <div className="font-display text-lg font-black text-ppb-text">
                        Taxa: {feeLabel}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                      paymentConfirmed
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                    )}
                  >
                    {paymentConfirmed ? "Confirmado" : "Pendente"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(["mercado_pago", "pagseguro", "ppc"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-bold transition",
                        paymentMethod === m
                          ? "border-ppb-primary bg-ppb-primary/15 text-ppb-primary"
                          : "border-ppb-border bg-ppb-background/40 text-ppb-mutedSoft hover:border-ppb-primary/40 hover:text-ppb-text"
                      )}
                    >
                      {m === "mercado_pago" ? "Mercado Pago" : m === "pagseguro" ? "PagSeguro" : "PPC"}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs text-ppb-mutedSoft">{providerDescription}</p>

                <button
                  type="button"
                  onClick={openPaymentFlow}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-4 py-2.5 text-sm font-black uppercase tracking-wider text-ppb-background transition hover:bg-ppb-primary/90"
                >
                  {paymentConfirmed ? "Revisar pagamento" : "Confirmar pagamento"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {/* DADOS */}
            <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card md:p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
                  <Gamepad2 className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
                    Seus dados
                  </div>
                  <div className="font-display text-lg font-black text-ppb-text">
                    Identificação na arena
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <Field label="Nickname / gamertag" hint="Como você aparece no chaveamento">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ex: BRZ_Kaique"
                    className="ppb-input"
                    autoComplete="off"
                  />
                </Field>

                <Field label="Time / clube (opcional)">
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ex: BRZ Academy"
                    className="ppb-input"
                  />
                </Field>

                <Field label="Plataforma">
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPlatform(opt)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                          platform === opt
                            ? "border-ppb-primary bg-ppb-primary/15 text-ppb-primary"
                            : "border-ppb-border bg-ppb-background/40 text-ppb-mutedSoft hover:border-ppb-primary/40 hover:text-ppb-text"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="WhatsApp" hint="Usado para avisos de partidas e disputas">
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="ppb-input"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </Field>
              </div>

              {alreadyRegistered ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Esse nickname já consta como inscrito. Se for outra pessoa, troque o nick.
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] uppercase tracking-wider text-ppb-mutedSoft">
                  {inscricoesAbertas
                    ? `Faltam ${vagasRestantes} vaga${vagasRestantes === 1 ? "" : "s"}`
                    : lotado
                      ? "Chaveamento completo"
                      : "Inscrições encerradas"}
                </p>
                <button
                  type="submit"
                  disabled={submitting || !inscricoesAbertas || alreadyRegistered}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wider transition",
                    "bg-ppb-primary text-ppb-background hover:bg-ppb-primary/90",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                    </>
                  ) : (
                    <>
                      Confirmar inscrição
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* INSCRITOS AO VIVO */}
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/30">
                    <Users className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-accent">
                      Inscritos
                    </div>
                    <div className="font-display text-lg font-black text-ppb-text">
                      Lista ao vivo
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-ppb-background/60 px-2.5 py-1 font-mono text-[11px] font-bold text-ppb-text ring-1 ring-ppb-border">
                  {liveCount}/{max}
                </span>
              </div>

              {registrations.length === 0 ? (
                <p className="mt-4 text-sm text-ppb-mutedSoft">
                  Nenhum inscrito ainda. Seja o primeiro a marcar presença.
                </p>
              ) : (
                <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                  {registrations.map((r, idx) => (
                    <li
                      key={`${r.nickname}-${idx}`}
                      className="flex items-center gap-3 rounded-xl border border-ppb-border bg-ppb-background/40 px-3 py-2.5"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ppb-primary/15 font-mono text-[11px] font-black text-ppb-primary">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-ppb-text">{r.nickname}</div>
                        {r.teamName ? (
                          <div className="truncate text-[11px] text-ppb-mutedSoft">{r.teamName}</div>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-ppb-background/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft ring-1 ring-ppb-border">
                        {r.platform}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-ppb-border bg-ppb-surface/60 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
                <Flame className="h-3.5 w-3.5" /> Como funciona
              </div>
              <ol className="mt-3 space-y-2 text-sm text-ppb-mutedSoft">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ppb-primary" />
                  Sua inscrição aparece na lista ao vivo.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ppb-primary" />
                  Quando a última vaga for preenchida, o chaveamento é gerado automaticamente.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ppb-primary" />
                  Avisos de partida chegam pelo seu WhatsApp.
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .ppb-input {
          width: 100%;
          background: rgba(6, 7, 11, 0.5);
          border: 1px solid var(--ppb-border, rgba(255, 255, 255, 0.08));
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: var(--ppb-text, #fff);
          font-size: 0.95rem;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .ppb-input:focus {
          border-color: rgba(255, 106, 0, 0.6);
          box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.15);
        }
        .ppb-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-ppb-mutedSoft/80">{hint}</p> : null}
    </div>
  );
}

function LiveStatCard({
  icon,
  label,
  value,
  hint,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "ok" | "warn" | "danger" | "gold" | "accent";
}) {
  const toneClasses = {
    ok: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
    warn: "border-amber-500/30 bg-amber-500/5 text-amber-300",
    danger: "border-rose-500/30 bg-rose-500/5 text-rose-300",
    gold: "border-ppb-gold/30 bg-ppb-gold/5 text-ppb-gold",
    accent: "border-ppb-accent/30 bg-ppb-accent/5 text-ppb-accent"
  }[tone];

  return (
    <div className="overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface p-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg ring-1", toneClasses)}>
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft">
          {label}
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-black text-ppb-text">{value}</div>
      <div className="mt-1 text-[11px] text-ppb-mutedSoft">{hint}</div>
    </div>
  );
}

function SuccessScreen({
  tournamentId,
  tournamentName,
  heroImage,
  bracketGenerated,
  nickname,
  liveCount,
  max
}: {
  tournamentId: string;
  tournamentName: string;
  heroImage?: string;
  bracketGenerated: boolean;
  nickname: string;
  liveCount: number;
  max: number;
}) {
  return (
    <div className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-ppb-background px-4 py-12">
      {heroImage ? (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image src={heroImage} alt="" fill priority className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-ppb-background/70 via-ppb-background/90 to-ppb-background" />
        </div>
      ) : null}
      <div className="pointer-events-none absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-[140px]" />

      <div className="w-full max-w-xl space-y-5 rounded-3xl border border-emerald-500/30 bg-ppb-surface/90 p-8 text-center shadow-ppb-card backdrop-blur md:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            Inscrição confirmada
          </div>
          <h1 className="font-display text-3xl font-black uppercase text-white md:text-4xl">
            Você está dentro,
            <br />
            <span className="text-ppb-primary">{nickname}</span>
          </h1>
          <p className="text-sm text-ppb-mutedSoft">
            Vaga garantida em <strong className="text-ppb-text">{tournamentName}</strong>.
            Avisos de partida chegam pelo WhatsApp.
          </p>
        </div>

        <div className="rounded-2xl border border-ppb-border bg-ppb-background/40 px-4 py-3 text-sm text-ppb-mutedSoft">
          <span className="font-mono text-ppb-text">
            {liveCount}/{max}
          </span>{" "}
          inscritos no momento.
        </div>

        {bracketGenerated ? (
          <div className="rounded-2xl border border-ppb-primary/40 bg-ppb-primary/10 p-4 text-sm text-ppb-text">
            <div className="flex items-center justify-center gap-2 text-ppb-primary">
              <Sparkles className="h-4 w-4" />
              <span className="font-bold uppercase tracking-wider">Chaveamento gerado!</span>
            </div>
            <p className="mt-1 text-xs text-ppb-mutedSoft">
              Sua inscrição completou as vagas — as partidas já estão definidas.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink
            href={`/campeonatos/${tournamentId}`}
            variant="primary"
            className="justify-center"
          >
            {bracketGenerated ? "Ver chaveamento" : "Voltar ao campeonato"}
          </ButtonLink>
          <ButtonLink
            href={`/perfil/${encodeURIComponent(nickname)}`}
            variant="ghost"
            className="justify-center"
          >
            Meu perfil
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
