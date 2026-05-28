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
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <OverviewStat label="Novos usuários" value={String(newUsersWeek)} hint="últimos 7 dias" />
        <OverviewStat label="Pagamentos aprovados" value={String(approvedPayments.length)} hint={`${formatBrl(approvedRevenue)} em receita recente`} accent="cyan" />
        <OverviewStat label="PPC comprados" value={String(monthMetric?.bought ?? 0)} hint="volume dos últimos 30 dias" accent="gold" />
        <OverviewStat label="Saques pendentes" value={String(pendingWithdrawals)} hint="pedidos aguardando análise" accent="orange" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">Usuários</div>
              <h3 className="mt-2 text-lg font-black uppercase tracking-wider text-white">Últimos cadastros</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
              {latestUsers.length} listados
            </span>
          </div>

          {latestUsers.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-white/58">Ainda não há usuários sincronizados no Supabase para mostrar aqui.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {latestUsers.map((user, index) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <strong className="text-sm text-white">
                      {index + 1}. {user.full_name}
                    </strong>
                    <p className="mt-1 text-sm leading-7 text-white/58">
                      {user.gamertag} • {new Date(user.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="border-b border-white/10 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Operação</div>
            <h3 className="mt-2 text-lg font-black uppercase tracking-wider text-white">Leitura rápida do sistema</h3>
          </div>

          <div className="mt-4 grid gap-3">
            <OverviewRow
              title="Reclamações abertas"
              copy="Chamados que ainda precisam de resposta do time operacional."
              value={String(openComplaints)}
            />
            <OverviewRow
              title="Movimentações de PPC"
              copy={`${monthMetric?.transactions ?? 0} registros no período mensal.`}
              value={`${monthMetric?.used ?? 0} usados`}
              accent="gold"
            />
            <OverviewRow
              title="Financeiro recente"
              copy="Pagamentos aprovados no Mercado Pago com leitura rápida."
              value={formatBrl(approvedRevenue)}
              accent="cyan"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  hint,
  accent = "orange"
}: {
  label: string;
  value: string;
  hint: string;
  accent?: "orange" | "cyan" | "gold";
}) {
  const accentClass =
    accent === "cyan"
      ? "text-cyan-300"
      : accent === "gold"
        ? "text-amber-300"
        : "text-ppb-primary";

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">{label}</div>
      <div className={`mt-2 font-display text-4xl font-black uppercase ${accentClass}`}>{value}</div>
      <p className="mt-2 text-sm leading-7 text-white/58">{hint}</p>
    </div>
  );
}

function OverviewRow({
  title,
  copy,
  value,
  accent = "orange"
}: {
  title: string;
  copy: string;
  value: string;
  accent?: "orange" | "cyan" | "gold";
}) {
  const accentClass =
    accent === "cyan"
      ? "text-cyan-300"
      : accent === "gold"
        ? "text-amber-300"
        : "text-ppb-primary";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <strong className="text-sm text-white">{title}</strong>
        <p className="mt-1 text-sm leading-7 text-white/58">{copy}</p>
      </div>
      <div className={`font-display text-xl font-black uppercase ${accentClass}`}>{value}</div>
    </div>
  );
}
