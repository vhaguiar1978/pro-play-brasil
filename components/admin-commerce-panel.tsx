import Link from "next/link";
import { COIN_PACKS, CUSTOM_COIN_UNIT_BRL, MAX_PACK_COINS, formatBrl } from "@/lib/coin-offers";
import { searchMercadoPagoPayments } from "@/lib/mercado-pago";
import { buildPpcMetrics, getAdminPpcLedger } from "@/lib/ppc-ledger-server";

function formatUnitPrice(priceBrl: number, coins: number) {
  return formatBrl(Math.round((priceBrl / coins) * 100) / 100);
}

function readPaymentLabel(status?: string) {
  if (status === "approved") return "Aprovado";
  if (status === "pending") return "Pendente";
  if (status === "rejected") return "Recusado";
  return status || "Sem status";
}

function readPaymentBadge(status?: string) {
  if (status === "approved") return "official";
  if (status === "rejected") return "community";
  return "";
}

export async function AdminCommercePanel() {
  const hasMercadoPago = Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim());
  const hasAppUrl = Boolean(process.env.NEXT_PUBLIC_APP_URL);
  const [gatewayPayments, ledgerEntries] = await Promise.all([
    hasMercadoPago ? searchMercadoPagoPayments(8).catch(() => []) : Promise.resolve([]),
    getAdminPpcLedger(40).catch(() => null)
  ]);

  const approvedPayments = gatewayPayments.filter((payment) => payment.status === "approved");
  const approvedRevenue = approvedPayments.reduce((sum, payment) => {
    const amount = typeof payment.transaction_amount === "number" ? payment.transaction_amount : 0;
    return sum + amount;
  }, 0);
  const metrics = ledgerEntries ? buildPpcMetrics(ledgerEntries) : [];

  return (
    <section className="stack" style={{ marginTop: 24 }}>
      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Planos de venda do PPC</h2>
          <p className="muted">
            Aqui ficam visíveis os pacotes ativos da carteira PPC e o valor por moeda em cada faixa.
          </p>
        </div>

        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Sistema de cobrança</h2>
          <p className="muted">
            O Checkout Pro do Mercado Pago já está ligado na produção para compra de PPC e inscrições em reais.
          </p>
        </div>
      </div>

      <div className="grid cols-3">
        {COIN_PACKS.map((pack) => (
          <div key={pack.id} className="card soft">
            <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
              <h3 style={{ margin: 0 }}>{pack.coins} PPC</h3>
              {pack.badge ? <span className="badge official">{pack.badge}</span> : <span className="badge">Ativo</span>}
            </div>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: "12px 0 8px" }}>{pack.label}</p>
            <p className="muted" style={{ margin: 0 }}>
              Valor médio por PPC: <strong>{formatUnitPrice(pack.priceBrl, pack.coins)}</strong>
            </p>
          </div>
        ))}
      </div>

      <div className="card soft">
        <div className="section-head">
          <div>
            <h2 style={{ margin: 0 }}>Faixa personalizada</h2>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              Compras acima de {MAX_PACK_COINS} PPC usam o valor de {formatBrl(CUSTOM_COIN_UNIT_BRL)} por PPC.
            </p>
          </div>
          <Link href="/arena/moedas" className="btn btn-primary">
            Ver área de moedas
          </Link>
        </div>
      </div>

      <div className="grid cols-3">
        <div className="participant-card">
          <div>
            <strong>Mercado Pago</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              Checkout real com Pix, cartão de crédito e boleto
            </div>
          </div>
          <span className={`badge ${hasMercadoPago ? "official" : "community"}`}>
            {hasMercadoPago ? "Configurado" : "Pendente"}
          </span>
        </div>

        <div className="participant-card">
          <div>
            <strong>URL do app</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              Retorno e links absolutos do sistema
            </div>
          </div>
          <span className={`badge ${hasAppUrl ? "official" : "community"}`}>
            {hasAppUrl ? "Configurada" : "Pendente"}
          </span>
        </div>

        <div className="participant-card">
          <div>
            <strong>Checkout do sistema</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              Preferência e retorno do gateway
            </div>
          </div>
          <span className="badge official">Ativo</span>
        </div>
      </div>

      <div className="grid cols-3">
        <div className="card soft">
          <h3 style={{ marginTop: 0 }}>Pagamentos aprovados</h3>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "10px 0 6px" }}>{approvedPayments.length}</p>
          <p className="muted">Quantidade recente de pagamentos aprovados no Mercado Pago.</p>
        </div>
        <div className="card soft">
          <h3 style={{ marginTop: 0 }}>Receita recente</h3>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "10px 0 6px" }}>{formatBrl(approvedRevenue)}</p>
          <p className="muted">Soma dos pagamentos aprovados listados pelo gateway.</p>
        </div>
        <div className="card soft">
          <h3 style={{ marginTop: 0 }}>PPC comprados</h3>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "10px 0 6px" }}>
            {metrics.find((metric) => metric.id === "month")?.bought ?? 0} PPC
          </p>
          <p className="muted">Volume dos últimos 30 dias no livro real de PPC.</p>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card soft">
          <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>Histórico real do gateway</h2>
            <span className="badge official">{gatewayPayments.length} eventos</span>
          </div>
          {gatewayPayments.length === 0 ? (
            <p className="muted" style={{ marginTop: 12 }}>
              Nenhum pagamento retornado ainda pelo Mercado Pago.
            </p>
          ) : (
            <div className="stack" style={{ marginTop: 14 }}>
              {gatewayPayments.map((payment) => (
                <div
                  key={`${payment.id ?? payment.external_reference ?? payment.date_created ?? "payment"}`}
                  className="participant-card"
                >
                  <div>
                    <strong>{payment.external_reference || `Pagamento ${payment.id}`}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {payment.payment_type_id || "checkout"} •{" "}
                      {payment.date_created
                        ? new Date(payment.date_created).toLocaleString("pt-BR")
                        : "sem data"}
                    </div>
                  </div>
                  <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
                    <strong>{formatBrl(typeof payment.transaction_amount === "number" ? payment.transaction_amount : 0)}</strong>
                    <span className={`badge ${readPaymentBadge(payment.status)}`}>{readPaymentLabel(payment.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card soft">
          <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>Livro real de PPC</h2>
            <span className="badge">{ledgerEntries?.length ?? 0} registros</span>
          </div>
          {!ledgerEntries || ledgerEntries.length === 0 ? (
            <p className="muted" style={{ marginTop: 12 }}>
              Ainda não houve movimentações reais de PPC gravadas no Supabase.
            </p>
          ) : (
            <div className="stack" style={{ marginTop: 14 }}>
              {ledgerEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="participant-card">
                  <div>
                    <strong>{entry.note}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {entry.source} • {new Date(entry.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span className={`badge ${entry.direction === "in" ? "official" : "community"}`}>
                    {entry.direction === "in" ? "+" : "-"}
                    {entry.amount} PPC
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
