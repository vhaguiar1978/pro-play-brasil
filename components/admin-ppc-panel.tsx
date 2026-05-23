"use client";

import { useEffect, useState } from "react";
import { getPpcMetrics, readPpcLedger, type PpcLedgerEntry } from "@/lib/ppc-ledger";

type Metric = ReturnType<typeof getPpcMetrics>[number];

export function AdminPpcPanel() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [entries, setEntries] = useState<PpcLedgerEntry[]>([]);

  function refresh() {
    setMetrics(getPpcMetrics());
    setEntries(readPpcLedger());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Controle de PPC</h2>
        <p className="muted">
          Aqui voce acompanha quantos PPC foram comprados, quanto saiu do sistema por uso e quanto voltou por payout ou reembolso.
        </p>
      </div>

      <div className="grid cols-3">
        {metrics.map((metric) => (
          <div key={metric.id} className="card soft">
            <h3 style={{ marginTop: 0 }}>{metric.label}</h3>
            <div className="stack">
              <div className="participant-card">
                <div>
                  <strong>PPC comprados</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {metric.transactions} movimentacoes no periodo
                  </div>
                </div>
                <span className="badge official">{metric.bought} PPC</span>
              </div>
              <div className="participant-card">
                <div>
                  <strong>PPC usados</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Apostas, inscricoes e debitos
                  </div>
                </div>
                <span className="badge community">{metric.used} PPC</span>
              </div>
              <div className="participant-card">
                <div>
                  <strong>PPC retornados</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Payouts e reembolsos
                  </div>
                </div>
                <span className="badge">{metric.returned} PPC</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card soft">
        <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
          <h2 style={{ margin: 0 }}>Movimentacoes recentes</h2>
          <button type="button" className="btn btn-ghost" onClick={refresh}>
            Atualizar
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>Ainda nao houve movimentacoes de PPC registradas neste navegador.</p>
        ) : (
          <div className="stack" style={{ marginTop: 14 }}>
            {entries.slice(0, 12).map((entry) => (
              <div key={entry.id} className="participant-card">
                <div>
                  <strong>{entry.note}</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {entry.source} • {new Date(entry.createdAt).toLocaleString("pt-BR")}
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
  );
}
