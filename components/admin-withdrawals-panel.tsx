"use client";

import { useEffect, useState } from "react";

type WithdrawalRecord = {
  id: string;
  user_id: string;
  nickname: string;
  full_name: string;
  ppc_amount: number;
  brl_estimate: number;
  pix_key: string;
  contact: string;
  status: "pendente" | "pago" | "recusado";
  admin_note: string;
  created_at: string;
  processed_at: string | null;
};

export function AdminWithdrawalsPanel() {
  const [requests, setRequests] = useState<WithdrawalRecord[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const response = await fetch("/api/withdrawals", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; requests?: WithdrawalRecord[] };

      if (response.ok && payload.ok && Array.isArray(payload.requests)) {
        setRequests(payload.requests);
      }
    } catch {
      // sem fallback local — exige API real
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function processRequest(requestId: string, status: "pago" | "recusado", adminNote: string) {
    try {
      const response = await fetch(`/api/withdrawals/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (response.ok && payload.ok) {
        await refresh();
        return { ok: true };
      }

      return { ok: false, message: payload.message ?? "Erro ao processar saque." };
    } catch {
      return { ok: false, message: "Falha de rede ao processar saque." };
    }
  }

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {flash ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>Saques</strong>
          <span className="muted">{flash}</span>
        </div>
      ) : null}

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Saques de PPC</h2>
        <p className="muted">
          Acompanhe pedidos de saque, aprove o pagamento ou recuse com estorno automatico no ledger do usuario.
        </p>
      </div>

      {loading ? (
        <div className="card soft">
          <p className="muted" style={{ margin: 0 }}>Carregando pedidos de saque...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card soft">
          <p className="muted" style={{ margin: 0 }}>Nenhum pedido de saque registrado ainda.</p>
        </div>
      ) : (
        requests.map((request) => (
          <form
            key={request.id}
            className="card soft"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const status = String(form.get("status") ?? "pendente") as "pendente" | "pago" | "recusado";
              const note = String(form.get("note") ?? "");
              if (status === "pendente") return;

              void processRequest(request.id, status === "pago" ? "pago" : "recusado", note).then((result) => {
                if (result.ok) {
                  setFlash(`Pedido de saque de ${request.nickname} atualizado para ${status}.`);
                } else {
                  setFlash(`Erro: ${result.message}`);
                }
              });
            }}
          >
            <div className="section-head">
              <div>
                <span className={`badge ${request.status === "pago" ? "official" : request.status === "recusado" ? "community" : ""}`}>
                  {request.status}
                </span>
                <h2 style={{ margin: "14px 0 6px" }}>{request.nickname}</h2>
                <p className="muted" style={{ margin: 0 }}>
                  {request.full_name} • {request.contact} • Pix: {request.pix_key}
                </p>
              </div>
            </div>

            <div className="grid cols-3" style={{ marginTop: 16 }}>
              <div className="participant-card">
                <div>
                  <strong>Pedido</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>{request.ppc_amount} PPC</div>
                </div>
                <span className="badge">{request.ppc_amount} PPC</span>
              </div>
              <div className="participant-card">
                <div>
                  <strong>Estimativa</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {Number(request.brl_estimate).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                </div>
                <span className="badge official">BRL</span>
              </div>
              <div className="participant-card">
                <div>
                  <strong>Solicitado em</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {new Date(request.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <span className="badge community">Registro</span>
              </div>
            </div>

            {request.status !== "pendente" ? (
              <div className="timer-banner" style={{ marginTop: 16 }}>
                <strong>{request.status === "pago" ? "Pago" : "Recusado"}</strong>
                <span className="muted">{request.admin_note || "Sem observacao do admin."}</span>
              </div>
            ) : (
              <div className="grid cols-2" style={{ marginTop: 16 }}>
                <div className="field">
                  <label htmlFor={`withdraw-status-${request.id}`}>Status do saque</label>
                  <select id={`withdraw-status-${request.id}`} name="status" defaultValue="pendente">
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="recusado">Recusado</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`withdraw-note-${request.id}`}>Observacao do admin</label>
                  <textarea
                    id={`withdraw-note-${request.id}`}
                    name="note"
                    defaultValue={request.admin_note}
                    placeholder="Escreva aqui um retorno sobre o saque..."
                  />
                </div>
              </div>
            )}

            {request.status === "pendente" ? (
              <div className="inline-actions">
                <button type="submit" className="btn btn-primary">
                  Salvar saque
                </button>
              </div>
            ) : null}
          </form>
        ))
      )}
    </div>
  );
}
