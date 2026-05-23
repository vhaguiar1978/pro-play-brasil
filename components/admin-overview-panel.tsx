import "server-only";

import { createClient } from "@/lib/supabase/server";
import { searchMercadoPagoPayments } from "@/lib/mercado-pago";
import { buildPpcMetrics, getAdminPpcLedger } from "@/lib/ppc-ledger-server";

type LatestUser = {
  id: string;
  full_name: string;
  gamertag: string;
  created_at: string;
  status: "active" | "penalized" | "banned";
};

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function isRecent(createdAt: string, days: number) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export async function AdminOverviewPanel() {
  const supabase = await createClient();

  const [usersResponse, openComplaintsResponse, pendingWithdrawalsResponse, gatewayPayments, ledgerEntries] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,gamertag,created_at,status")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "aberta"),
      supabase.from("withdrawal_requests").select("*", { count: "exact", head: true }).eq("status", "pendente"),
      searchMercadoPagoPayments(20).catch(() => []),
      getAdminPpcLedger(200).catch(() => null)
    ]);

  const latestUsers = (Array.isArray(usersResponse.data) ? usersResponse.data : []) as LatestUser[];
  const newUsersWeek = latestUsers.filter((user) => isRecent(user.created_at, 7)).length;
  const approvedPayments = gatewayPayments.filter((payment) => payment.status === "approved");
  const approvedRevenue = approvedPayments.reduce((sum, payment) => {
    const amount = typeof payment.transaction_amount === "number" ? payment.transaction_amount : 0;
    return sum + amount;
  }, 0);
  const ppcMetrics = ledgerEntries ? buildPpcMetrics(ledgerEntries) : [];
  const monthMetric = ppcMetrics.find((metric) => metric.id === "month");
  const pendingWithdrawals = pendingWithdrawalsResponse.count ?? 0;
  const openComplaints = openComplaintsResponse.count ?? 0;

  return (
    <div className="stack">
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span>Novos usuarios</span>
          <strong>{newUsersWeek}</strong>
          <small>ultimos 7 dias</small>
        </div>
        <div className="admin-kpi-card">
          <span>Pagamentos aprovados</span>
          <strong>{approvedPayments.length}</strong>
          <small>{formatBrl(approvedRevenue)} em receita recente</small>
        </div>
        <div className="admin-kpi-card">
          <span>PPC comprados</span>
          <strong>{monthMetric?.bought ?? 0}</strong>
          <small>volume dos ultimos 30 dias</small>
        </div>
        <div className="admin-kpi-card">
          <span>Saques pendentes</span>
          <strong>{pendingWithdrawals}</strong>
          <small>pedidos aguardando analise</small>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card soft">
          <div className="section-head">
            <div>
              <span className="badge official">Usuarios</span>
              <h3 style={{ margin: "10px 0 0" }}>Ultimos cadastros</h3>
            </div>
            <span className="badge">{latestUsers.length} listados</span>
          </div>

          {latestUsers.length === 0 ? (
            <p className="muted" style={{ marginTop: 16 }}>
              Ainda nao ha usuarios sincronizados no Supabase para mostrar aqui.
            </p>
          ) : (
            <div className="stack" style={{ marginTop: 16 }}>
              {latestUsers.map((user, index) => (
                <div key={user.id} className="participant-card">
                  <div>
                    <strong>{index + 1}. {user.full_name}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {user.gamertag} • {new Date(user.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span className="badge">{user.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card soft">
          <div className="section-head">
            <div>
              <span className="badge official">Operacao</span>
              <h3 style={{ margin: "10px 0 0" }}>Leitura rapida do sistema</h3>
            </div>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            <div className="participant-card">
              <div>
                <strong>Reclamacoes abertas</strong>
                <div className="muted" style={{ fontSize: "0.9rem" }}>
                  Chamados que ainda precisam de resposta.
                </div>
              </div>
              <span className={`badge ${openComplaints > 0 ? "community" : "official"}`}>{openComplaints}</span>
            </div>

            <div className="participant-card">
              <div>
                <strong>Movimentacoes de PPC</strong>
                <div className="muted" style={{ fontSize: "0.9rem" }}>
                  {monthMetric?.transactions ?? 0} registros no periodo mensal.
                </div>
              </div>
              <span className="badge official">{monthMetric?.used ?? 0} usados</span>
            </div>

            <div className="participant-card">
              <div>
                <strong>Financeiro recente</strong>
                <div className="muted" style={{ fontSize: "0.9rem" }}>
                  Pagamentos aprovados no Mercado Pago.
                </div>
              </div>
              <span className="badge official">{formatBrl(approvedRevenue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
