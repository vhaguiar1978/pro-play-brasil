"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PaywallModal } from "@/components/paywall-modal";
import { readArenaProfile } from "@/lib/profile-storage";
import { getTournamentById } from "@/lib/mock-tournaments";
import { appendPpcLedgerEntry } from "@/lib/ppc-ledger";
import {
  getTournamentRegistrationsById,
  type TournamentRegistration,
  upsertTournamentRegistration
} from "@/lib/tournament-registration";
import { readWallet, writeWallet } from "@/lib/wallet-storage";

type Props = { params: Promise<{ id: string }> };

type PaymentMethod = "mercado_pago" | "pagseguro" | "ppc";

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

export default function InscricaoPage({ params }: Props) {
  const router = useRouter();
  const { id: tournamentId } = use(params);
  const tournament = getTournamentById(tournamentId);

  const [nickname, setNickname] = useState("");
  const [teamName, setTeamName] = useState("");
  const [platform, setPlatform] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercado_pago");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const feeLabel = tournament?.feeLabel ?? null;
  const requiresPayment = Boolean(feeLabel);
  const ppcFee = parsePpcAmount(feeLabel);
  const brlFee = parseBrlAmount(feeLabel);

  const providerDescription = useMemo(() => {
    if (paymentMethod === "mercado_pago") return "Checkout em reais com foco no Brasil.";
    if (paymentMethod === "pagseguro") return "Checkout alternativo para Pix e cartao.";
    return "Pagamento interno usando a carteira PPC.";
  }, [paymentMethod]);

  useEffect(() => {
    const existing = getTournamentRegistrationsById(tournamentId)[0];
    if (existing) {
      setNickname(existing.nickname);
      setTeamName(existing.teamName);
      setPlatform(existing.platform);
      setWhatsapp(existing.whatsapp);
      setPaymentMethod(existing.paymentMethod === "free" ? "mercado_pago" : existing.paymentMethod);
      setPaymentConfirmed(existing.paymentStatus === "paid" || existing.paymentMethod === "free");
      return;
    }

    const profile = readArenaProfile();
    if (profile) {
      setNickname(profile.gamertag);
      setPlatform(profile.platform);
      if (tournament?.gameSlug) {
        setTeamName(profile.teamByGame[tournament.gameSlug] ?? "");
      }
    }
  }, [tournamentId, tournament?.gameSlug]);

  if (!tournament) {
    return (
      <div className="page">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Campeonato nao encontrado</h1>
          <Link href="/campeonatos" className="btn btn-primary">
            Voltar aos campeonatos
          </Link>
        </div>
      </div>
    );
  }

  const tournamentName = tournament.name;

  const checkoutPayload =
    requiresPayment && paymentMethod === "mercado_pago" && brlFee > 0
      ? {
          kind: "tournament_fee" as const,
          title: `Inscricao - ${tournament.name}`,
          description: `Taxa de inscricao do campeonato ${tournament.name}`,
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

    if (!nickname.trim()) {
      setError("Preencha o nickname antes de abrir o pagamento.");
      return;
    }

    if (!platform.trim()) {
      setError("Preencha a plataforma antes de abrir o pagamento.");
      return;
    }

    if (!whatsapp.trim()) {
      setError("Preencha o WhatsApp antes de abrir o pagamento.");
      return;
    }

    setPaymentOpen(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nick = nickname.trim();
    const team = teamName.trim();
    const plat = platform.trim();
    const wa = whatsapp.trim();
    const existing = getTournamentRegistrationsById(tournamentId).find(
      (registration) => registration.nickname.trim().toLowerCase() === nick.toLowerCase()
    );

    if (!nick) return setError("Informe seu nickname.");
    if (!plat) return setError("Informe sua plataforma.");
    if (!wa) return setError("Informe seu WhatsApp para contato.");
    if (requiresPayment && !paymentConfirmed) return setError("Confirme o pagamento da inscricao antes de salvar.");

    if (requiresPayment && paymentMethod === "ppc" && existing?.paymentStatus !== "paid") {
      const wallet = readWallet();
      if (wallet.balance < ppcFee) {
        return setError(`Seu saldo nao cobre a inscricao em PPC. Necessario: ${ppcFee} PPC.`);
      }

      const nextWallet = {
        balance: wallet.balance - ppcFee,
        updatedAt: new Date().toISOString()
      };
      writeWallet(nextWallet);
      appendPpcLedgerEntry({
        type: "tournament_fee",
        amount: ppcFee,
        direction: "out",
        source: tournamentId,
        note: `Inscricao em ${tournamentName}`
      });
    }

    const next: TournamentRegistration = {
      tournamentId,
      nickname: nick,
      teamName: team,
      platform: plat,
      whatsapp: wa,
      paymentMethod: requiresPayment ? paymentMethod : "free",
      paymentStatus: requiresPayment ? "paid" : "free",
      createdAt: new Date().toISOString()
    };

    upsertTournamentRegistration(next);
    setStatus("saved");
  }

  return (
    <div className="page">
      <PaywallModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onPaid={() => {
          setPaymentConfirmed(true);
          setPaymentOpen(false);
        }}
        title="Pagamento da inscricao"
        description={`Fluxo demonstrativo para ${tournament.name}. Depois ligamos no gateway real escolhido.`}
        priceLabel={feeLabel ?? "Gratis"}
        ruleNote={`Aqui voce consegue cobrar com ${paymentMethod === "mercado_pago" ? "Mercado Pago" : paymentMethod === "pagseguro" ? "PagSeguro" : "PPC"} e deixar a inscricao confirmada depois da aprovacao.`}
        ariaLabel="Pagamento da inscricao do campeonato"
        checkoutPayload={checkoutPayload}
      />

      <section className="page-hero">
        <span className="badge">Inscricao</span>
        <h1>Inscrever-se no campeonato</h1>
        <p className="muted">
          Agora a inscricao aceita nickname e nome do time. Quando houver taxa, o pagamento precisa ser confirmado
          antes da vaga ficar marcada como confirmada.
        </p>
        {tournament.minimumPlayers ? (
          <p className="muted">
            Regra deste campeonato: cada clube precisa entrar com no minimo {tournament.minimumPlayers} jogadores.
          </p>
        ) : null}
        <div className="inline-actions">
          <Link href={`/campeonatos/${tournamentId}`} className="btn btn-secondary">
            Voltar ao campeonato
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/campeonatos")}>
            Ver todos
          </button>
        </div>
      </section>

      <div className="stack">
        {requiresPayment ? (
          <div className="card">
            <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
              <h2 style={{ margin: 0 }}>Pagamento da inscricao</h2>
              <span className={`status ${paymentConfirmed ? "ok" : "warn"}`}>
                {paymentConfirmed ? "Pagamento confirmado" : "Aguardando pagamento"}
              </span>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              Taxa deste campeonato: <strong>{feeLabel}</strong>. Aqui voce ja consegue visualizar como vai ficar o fluxo
              de cobranca para Mercado Pago, PagSeguro ou PPC.
            </p>

            <div className="pill-row" style={{ marginTop: 14 }}>
              <button
                type="button"
                className={`pill ${paymentMethod === "mercado_pago" ? "active" : ""}`}
                onClick={() => setPaymentMethod("mercado_pago")}
              >
                Mercado Pago
              </button>
              <button
                type="button"
                className={`pill ${paymentMethod === "pagseguro" ? "active" : ""}`}
                onClick={() => setPaymentMethod("pagseguro")}
              >
                PagSeguro
              </button>
              <button
                type="button"
                className={`pill ${paymentMethod === "ppc" ? "active" : ""}`}
                onClick={() => setPaymentMethod("ppc")}
              >
                PPC
              </button>
            </div>

            <div className="timer-banner" style={{ marginTop: 14 }}>
              <strong style={{ color: "#92400e" }}>Provedor selecionado</strong>
              <span className="muted">{providerDescription}</span>
            </div>

            <div className="inline-actions">
              <button type="button" className="btn btn-primary" onClick={openPaymentFlow}>
                {paymentConfirmed ? "Revisar pagamento" : "Confirmar pagamento"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Seus dados</h2>
          <form className="stack" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="nickname">Jogador / nickname</label>
              <input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: BRZ_Kaique"
                autoComplete="nickname"
              />
            </div>

            <div className="field">
              <label htmlFor="teamName">Nome do time (opcional)</label>
              <input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ex: BRZ Academy"
              />
            </div>

            <div className="field">
              <label>Plataforma</label>
              <div className="pill-row" aria-label="Plataforma">
                {(["PC", "PlayStation", "Xbox", "Mobile", "Crossplay"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`pill ${platform === option ? "active" : ""}`}
                    onClick={() => setPlatform(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: (11) 99999-9999"
                autoComplete="tel"
              />
            </div>

            {error ? (
              <div className="timer-banner" style={{ borderColor: "rgba(255, 82, 82, 0.35)" }}>
                <strong style={{ color: "#b91c1c" }}>Erro</strong>
                <span className="muted" style={{ color: "#b91c1c" }}>
                  {error}
                </span>
              </div>
            ) : null}

            {status === "saved" ? (
              <div className="timer-banner" style={{ borderColor: "rgba(0, 200, 83, 0.35)" }}>
                <strong style={{ color: "#047857" }}>Inscricao salva</strong>
                <span className="muted" style={{ color: "#047857" }}>
                  Sua entrada foi registrada. Agora ela tambem aparece na lista de participantes deste campeonato.
                </span>
              </div>
            ) : null}

            <div className="inline-actions">
              <button type="submit" className="btn btn-primary">
                Confirmar inscricao
              </button>
              <Link href="/login" className="btn btn-ghost">
                Entrar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
