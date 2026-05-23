"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaywallModal } from "@/components/paywall-modal";
import { MercadoPagoCheckoutPayload } from "@/lib/payments";
import {
  COIN_PACKS,
  CUSTOM_COIN_UNIT_BRL,
  MAX_PACK_COINS,
  formatBrl,
  priceForCustomCoins
} from "@/lib/coin-offers";
import { appendPpcLedgerEntry, readPpcLedger, type PpcLedgerEntry } from "@/lib/ppc-ledger";
import { PPC_DEFAULT_TOURNAMENT_FEE, PPC_MIN_WITHDRAW, formatPpcToBrl } from "@/lib/ppc-economy";
import { readArenaProfile } from "@/lib/profile-storage";
import { defaultWallet, readWallet, writeWallet, type Wallet } from "@/lib/wallet-storage";

type WithdrawalRequest = {
  id: string;
  nickname: string;
  ppc_amount: number;
  brl_estimate: number;
  status: "pendente" | "pago" | "recusado";
  created_at: string;
};

type PayContext =
  | null
  | { kind: "pack"; coins: number; priceLabel: string; priceBrl: number }
  | { kind: "custom"; coins: number; priceLabel: string; priceBrl: number };

type RemoteLedgerEntry = {
  id: string;
  type: PpcLedgerEntry["type"];
  amount: number;
  direction: "in" | "out";
  source: string;
  note: string;
  created_at: string;
};

function formatLedgerLabel(entry: PpcLedgerEntry) {
  switch (entry.type) {
    case "purchase":
      return "Compra de PPC";
    case "bet_stake":
      return "Aposta enviada";
    case "bet_payout":
      return "Payout de aposta";
    case "bet_refund":
      return "Reembolso de aposta";
    case "tournament_fee":
      return "Inscricao em campeonato";
    case "withdraw_request":
      return "Pedido de saque";
    case "withdraw_paid":
      return "Saque pago";
    case "withdraw_refund":
      return "Saque recusado com estorno";
    case "manual_credit":
      return "Credito manual";
    case "manual_debit":
      return "Debito manual";
    default:
      return entry.note;
  }
}

export default function MoedasPage() {
  const [wallet, setWallet] = useState<Wallet>(defaultWallet());
  const [payOpen, setPayOpen] = useState(false);
  const [payCtx, setPayCtx] = useState<PayContext>(null);
  const [customCoins, setCustomCoins] = useState("");
  const [ledger, setLedger] = useState<PpcLedgerEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [contact, setContact] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [remoteMode, setRemoteMode] = useState(false);

  async function refreshWithdrawals() {
    try {
      const response = await fetch("/api/withdrawals", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; requests?: WithdrawalRequest[] };
      if (response.ok && payload.ok && Array.isArray(payload.requests)) {
        setWithdrawals(payload.requests);
      }
    } catch {
      // sem dados remotos disponíveis
    }
  }

  function refreshState(nextFlash?: string | null) {
    setWallet(readWallet());
    setLedger(readPpcLedger());

    const profile = readArenaProfile();
    if (profile) {
      setContact((prev) => (prev ? prev : profile.whatsapp || profile.email));
      setPixKey((prev) => (prev ? prev : profile.email || profile.whatsapp));
    }

    if (typeof nextFlash !== "undefined") {
      setFlash(nextFlash);
    }
  }

  async function hydrateRemoteLedger() {
    try {
      const response = await fetch("/api/ppc/ledger", { cache: "no-store" });
      if (!response.ok) return;

      const data = (await response.json()) as {
        ok?: boolean;
        balance?: number;
        entries?: RemoteLedgerEntry[];
      };

      if (!data.ok || !Array.isArray(data.entries) || typeof data.balance !== "number") {
        return;
      }

      const normalized = data.entries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        amount: entry.amount,
        direction: entry.direction,
        source: entry.source,
        note: entry.note,
        createdAt: entry.created_at
      })) satisfies PpcLedgerEntry[];

      setLedger(normalized);
      setWallet({
        balance: data.balance,
        updatedAt: normalized[0]?.createdAt ?? new Date().toISOString()
      });
      setRemoteMode(true);
    } catch {
      // Seguimos com o fallback local do navegador.
    }
  }

  useEffect(() => {
    refreshState();
    hydrateRemoteLedger();
    refreshWithdrawals();
  }, []);

  function creditCoins(amount: number, source: string, note: string, type: "purchase" | "manual_credit") {
    const walletState = readWallet();
    const next = {
      balance: walletState.balance + amount,
      updatedAt: new Date().toISOString()
    };
    writeWallet(next);
    appendPpcLedgerEntry({
      type,
      amount,
      direction: "in",
      source,
      note
    });
    refreshState();
  }

  function openPack(pack: (typeof COIN_PACKS)[number]) {
    setPayCtx({
      kind: "pack",
      coins: pack.coins,
      priceLabel: pack.label,
      priceBrl: pack.priceBrl
    });
    setPayOpen(true);
  }

  function openCustom() {
    const value = Number.parseInt(customCoins.replace(/\D/g, ""), 10);
    if (!Number.isFinite(value) || value <= MAX_PACK_COINS) return;

    const brl = priceForCustomCoins(value);
    setPayCtx({
      kind: "custom",
      coins: value,
      priceLabel: formatBrl(brl),
      priceBrl: brl
    });
    setPayOpen(true);
  }

  function onPaid() {
    if (!payCtx) return;
    creditCoins(payCtx.coins, "arena/moedas", `Compra de ${payCtx.coins} PPC`, "purchase");
    setPayOpen(false);
    setPayCtx(null);
    setCustomCoins("");
    setFlash(`Compra confirmada. ${payCtx.coins} PPC foram creditados na sua carteira.`);
  }

  function requestWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number.parseInt(withdrawAmount.replace(/\D/g, ""), 10);
    const cleanPixKey = pixKey.trim();
    const cleanContact = contact.trim();

    if (!Number.isFinite(amount) || amount < PPC_MIN_WITHDRAW) {
      return setFlash(`O saque minimo e ${PPC_MIN_WITHDRAW} PPC.`);
    }

    if (amount > wallet.balance) {
      return setFlash("Seu saldo atual nao cobre esse saque.");
    }

    if (!cleanPixKey) {
      return setFlash("Informe a chave Pix para receber o saque.");
    }

    if (!cleanContact) {
      return setFlash("Informe um contato para o admin falar com voce se precisar.");
    }

    void (async () => {
      try {
        const response = await fetch("/api/withdrawals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ppcAmount: amount,
            brlEstimate: Number((amount * 0.75).toFixed(2)),
            pixKey: cleanPixKey,
            contact: cleanContact
          })
        });

        const payload = (await response.json()) as { ok?: boolean; message?: string };

        if (response.ok && payload.ok) {
          setWithdrawAmount("");
          refreshState(`Pedido de saque enviado: ${amount} PPC. Aguarde a aprovacao do admin.`);
          hydrateRemoteLedger();
          return;
        }

        setFlash(`Erro: ${payload.message ?? "Nao foi possivel registrar o saque."}`);
      } catch {
        setFlash("Falha de rede ao enviar pedido de saque. Tente novamente.");
      }
    })();
  }

  const customNum = Number.parseInt(customCoins.replace(/\D/g, ""), 10);
  const customValid = Number.isFinite(customNum) && customNum > MAX_PACK_COINS;
  const customPreview = customValid ? formatBrl(priceForCustomCoins(customNum)) : null;
  const withdrawNum = Number.parseInt(withdrawAmount.replace(/\D/g, ""), 10);
  const withdrawPreview = Number.isFinite(withdrawNum) ? formatPpcToBrl(withdrawNum) : null;
  const recentLedger = useMemo(() => ledger.slice(0, 10), [ledger]);
  const checkoutPayload = useMemo<MercadoPagoCheckoutPayload | undefined>(() => {
    if (!payCtx) return undefined;

    return {
      kind: "ppc_purchase",
      title: `Compra de ${payCtx.coins} PPC`,
      description: `Credito de ${payCtx.coins} PPC na carteira do usuario`,
      quantity: 1,
      unitPrice: payCtx.priceBrl,
      externalReference: `ppc-${payCtx.kind}-${payCtx.coins}-${Date.now()}`,
      metadata: {
        coins: payCtx.coins,
        price_brl: payCtx.priceBrl
      }
    };
  }, [payCtx]);
  const myWithdrawals = useMemo(() => {
    const profile = readArenaProfile();
    const nick = profile?.gamertag?.trim().toLowerCase();
    if (!nick) return withdrawals.slice(0, 6);
    return withdrawals.filter((item) => item.nickname.trim().toLowerCase() === nick).slice(0, 6);
  }, [withdrawals]);

  return (
    <div className="stack">
      <section className="arena-topbar">
        <div>
          <h1>PPC</h1>
          <p>Carteira virtual do site com compra, pedido de saque e historico completo das movimentacoes.</p>
        </div>
        <div className="inline-actions">
          <Link href="/apostas" className="btn btn-secondary">
            Voltar para apostas
          </Link>
          {readArenaProfile()?.gamertag ? (
            <Link href={`/perfil/${encodeURIComponent(readArenaProfile()?.gamertag ?? "")}`} className="btn btn-ghost">
              Meu historico
            </Link>
          ) : null}
        </div>
      </section>

      {flash ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>PPC</strong>
          <span className="muted">{flash}</span>
        </div>
      ) : null}

      <div className="grid cols-3">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Saldo</h2>
          <p style={{ fontSize: "2.25rem", fontWeight: 900, margin: "6px 0 0" }}>{wallet.balance} PPC</p>
          <p className="muted" style={{ marginTop: 8 }}>
            Atualizado em {wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleString("pt-BR") : "Sincronizando..."}
          </p>
        </div>
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Inscricao padrao</h2>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "6px 0 0" }}>{PPC_DEFAULT_TOURNAMENT_FEE} PPC</p>
          <p className="muted">Faixa que deixamos como referencia para campeonatos normais.</p>
        </div>
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Saque minimo</h2>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "6px 0 0" }}>{PPC_MIN_WITHDRAW} PPC</p>
          <p className="muted">Conversao estimada atual: 1 PPC = R$ 0,75 para proteger a economia do site.</p>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Regras do PPC</h2>
          <ul className="muted" style={{ paddingLeft: 18, margin: 0 }}>
            <li>PPC funciona como moeda interna do site.</li>
            <li>Compra de PPC, inscricao e aposta ficam dentro da plataforma.</li>
            <li>Pedido de saque gera revisao do admin antes do pagamento.</li>
            <li>O saque usa taxa conservadora para evitar prejuizo na economia do PPC.</li>
          </ul>
        </div>

        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Pagamento liberado</h2>
          <ul className="muted" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Pix para aprovacao rapida.</li>
            <li>Cartao de credito no checkout oficial.</li>
            <li>Boleto para quem prefere pagar fora do cartao.</li>
            <li>O usuario escolhe a forma no mesmo checkout.</li>
          </ul>
        </div>
      </div>

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Comprar PPC</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Tres ofertas fixas com vantagem progressiva. O pagamento fica mais direto: Pix, cartao de credito ou boleto no mesmo checkout. Se quiser mais PPC que o maior pacote ({MAX_PACK_COINS.toLocaleString("pt-BR")}), use o campo abaixo.
        </p>

        <div className="coin-offers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {COIN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="card soft"
              style={{ padding: 18, display: "grid", gap: 10, alignContent: "start", borderColor: pack.badge ? "rgba(41, 182, 246, 0.35)" : undefined }}
            >
              {pack.badge ? <span className="badge official">{pack.badge}</span> : <span />}
              <div>
                <strong style={{ fontSize: "1.5rem" }}>{pack.coins.toLocaleString("pt-BR")}</strong>
                <span className="muted" style={{ marginLeft: 6 }}>PPC</span>
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FF6A00" }}>{pack.label}</div>
              <button type="button" className="btn btn-primary" onClick={() => openPack(pack)}>
                Comprar
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 18, borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(15, 20, 28, 0.55)" }}>
          <strong>Quero comprar mais PPC</strong>
          <p className="muted" style={{ margin: "8px 0 12px", fontSize: "0.95rem" }}>
            Informe uma quantidade maior que {MAX_PACK_COINS.toLocaleString("pt-BR")} PPC. Preco: {formatBrl(CUSTOM_COIN_UNIT_BRL)} por PPC.
          </p>
          <div className="inline-actions" style={{ flexWrap: "wrap" }}>
            <input
              type="number"
              min={MAX_PACK_COINS + 1}
              step={10}
              value={customCoins}
              onChange={(e) => setCustomCoins(e.target.value)}
              placeholder={`Ex: ${MAX_PACK_COINS + 20}`}
              style={{ flex: "1 1 200px", minHeight: 46 }}
            />
            {customPreview ? (
              <span className="muted" style={{ alignSelf: "center" }}>
                Total: <strong style={{ color: "#FF6A00" }}>{customPreview}</strong>
              </span>
            ) : null}
            <button type="button" className="btn btn-secondary" disabled={!customValid} onClick={openCustom}>
              Ir para pagamento
            </button>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Solicitar saque</h2>
          <p className="muted">
            O pedido de saque bloqueia o PPC na hora e vai para revisao do admin. Se for recusado, o PPC volta para sua carteira.
          </p>
          <form className="stack" onSubmit={requestWithdraw}>
            <div className="field">
              <label htmlFor="withdraw-amount">Quantidade em PPC</label>
              <input
                id="withdraw-amount"
                inputMode="numeric"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Minimo ${PPC_MIN_WITHDRAW}`}
              />
            </div>
            <div className="field">
              <label htmlFor="pix-key">Chave Pix</label>
              <input id="pix-key" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, email, telefone ou chave aleatoria" />
            </div>
            <div className="field">
              <label htmlFor="withdraw-contact">Contato</label>
              <input id="withdraw-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="WhatsApp ou email para retorno" />
            </div>
            {withdrawPreview ? (
              <div className="timer-banner">
                <strong style={{ color: "#92400e" }}>Estimativa</strong>
                <span className="muted">
                  {withdrawAmount} PPC {"->"} {withdrawPreview}
                </span>
              </div>
            ) : null}
            <button type="submit" className="btn btn-primary">Solicitar saque</button>
          </form>
        </div>

        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Meus saques</h2>
          {myWithdrawals.length === 0 ? (
            <p className="muted">Nenhum saque solicitado ainda.</p>
          ) : (
            <div className="stack">
              {myWithdrawals.map((request) => (
                <div key={request.id} className="participant-card">
                  <div>
                    <strong>{request.ppc_amount} PPC</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {new Date(request.created_at).toLocaleString("pt-BR")} • estimativa {Number(request.brl_estimate).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                  </div>
                  <span className={`badge ${request.status === "pago" ? "official" : request.status === "recusado" ? "community" : ""}`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card soft">
          <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>Historico de PPC</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                refreshState();
                hydrateRemoteLedger();
              }}
            >
              Atualizar
            </button>
          </div>
          {remoteMode ? (
            <p className="muted" style={{ marginTop: 8 }}>
              Este historico ja esta puxando as movimentacoes reais confirmadas no servidor.
            </p>
          ) : null}
          {recentLedger.length === 0 ? (
            <p className="muted" style={{ marginTop: 12 }}>Ainda nao houve movimentacoes em PPC neste navegador.</p>
          ) : (
            <div className="stack" style={{ marginTop: 12 }}>
              {recentLedger.map((entry) => (
                <div key={entry.id} className="participant-card">
                  <div>
                    <strong>{formatLedgerLabel(entry)}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {entry.note} • {new Date(entry.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span className={`badge ${entry.direction === "in" ? "official" : "community"}`}>
                    {entry.direction === "in" ? "+" : "-"}{entry.amount} PPC
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Historico competitivo</h2>
          <p className="muted">
            O historico das partidas agora fica ligado ao perfil do jogador, mostrando campeonato, horario, etapa e resultado.
          </p>
          <div className="inline-actions">
            {readArenaProfile()?.gamertag ? (
              <Link href={`/perfil/${encodeURIComponent(readArenaProfile()?.gamertag ?? "")}`} className="btn btn-primary">
                Ver meu historico
              </Link>
            ) : (
              <Link href="/cadastro" className="btn btn-primary">
                Criar perfil
              </Link>
            )}
          </div>
        </div>
      </div>

      <PaywallModal
        open={payOpen && payCtx !== null}
        ariaLabel="Pagamento de PPC"
        title="Pagamento - compra de PPC"
        description={
          payCtx
            ? payCtx.kind === "pack"
              ? `Pacote: ${payCtx.coins.toLocaleString("pt-BR")} PPC creditados apos confirmacao.`
              : `Compra personalizada: ${payCtx.coins.toLocaleString("pt-BR")} PPC creditados apos confirmacao.`
            : ""
        }
        priceLabel={payCtx?.priceLabel ?? "-"}
        ruleNote="Apos o Mercado Pago confirmar o pagamento por Pix, cartao de credito ou boleto, o saldo em PPC e creditado no site."
        showTournamentFooter={false}
        checkoutPayload={checkoutPayload}
        onClose={() => {
          setPayOpen(false);
          setPayCtx(null);
        }}
        onPaid={onPaid}
      />
    </div>
  );
}
