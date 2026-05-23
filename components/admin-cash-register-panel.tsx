"use client";

import { useEffect, useState } from "react";
import {
  openCashRegister,
  closeCashRegister,
  readCashRegisterSessions,
  getOpenCashRegisterSession,
  type CashRegisterSession
} from "@/lib/cash-register";

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

type ApiSession = {
  id: string;
  date: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  notes: string;
  status: "open" | "closed";
};

function apiToSession(s: ApiSession): CashRegisterSession {
  return {
    id: s.id,
    date: s.date,
    openedAt: s.opened_at,
    closedAt: s.closed_at,
    openingBalance: s.opening_balance,
    closingBalance: s.closing_balance,
    notes: s.notes,
    status: s.status
  };
}

export function AdminCashRegisterPanel() {
  const [sessions, setSessions] = useState<CashRegisterSession[]>([]);
  const [openSession, setOpenSession] = useState<CashRegisterSession | null>(null);
  const [flash, setFlash] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const [localMode, setLocalMode] = useState(false);

  // Formulário de abertura
  const [openingBalance, setOpeningBalance] = useState("");
  const [openNotes, setOpenNotes] = useState("");

  // Formulário de fechamento
  const [closingBalance, setClosingBalance] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/admin/cash-register", { cache: "no-store" });
      const payload = (await res.json()) as { ok?: boolean; sessions?: ApiSession[] };
      if (res.ok && payload.ok && Array.isArray(payload.sessions)) {
        const mapped = payload.sessions.map(apiToSession);
        setSessions(mapped);
        setOpenSession(mapped.find((s) => s.status === "open") ?? null);
        return;
      }
    } catch {
      // sem Supabase
    }

    setLocalMode(true);
    const all = readCashRegisterSessions();
    setSessions(all);
    setOpenSession(getOpenCashRegisterSession());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    const balance = parseFloat(openingBalance.replace(",", "."));
    if (isNaN(balance) || balance < 0) {
      setFlash({ text: "Informe um valor valido para o saldo de abertura (pode ser 0).", type: "err" });
      return;
    }

    setSaving(true);
    try {
      if (!localMode) {
        const res = await fetch("/api/admin/cash-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openingBalance: balance, notes: openNotes })
        });
        const payload = (await res.json()) as { ok?: boolean; message?: string };
        if (res.ok && payload.ok) {
          await refresh();
          setOpeningBalance("");
          setOpenNotes("");
          setFlash({ text: "Caixa aberto com sucesso!", type: "ok" });
          setSaving(false);
          return;
        }
        if (payload.message) {
          setFlash({ text: payload.message, type: "err" });
          setSaving(false);
          return;
        }
      }
    } catch {
      /* fallback */
    }

    // localStorage fallback
    openCashRegister(balance, openNotes);
    await refresh();
    setOpeningBalance("");
    setOpenNotes("");
    setFlash({ text: "Caixa aberto (modo local).", type: "ok" });
    setSaving(false);
  }

  async function handleClose(e: React.FormEvent) {
    e.preventDefault();
    if (!openSession) return;

    const balance = parseFloat(closingBalance.replace(",", "."));
    if (isNaN(balance) || balance < 0) {
      setFlash({ text: "Informe um valor valido para o saldo de fechamento.", type: "err" });
      return;
    }

    setSaving(true);
    try {
      if (!localMode) {
        const res = await fetch("/api/admin/cash-register", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: openSession.id, closingBalance: balance, notes: closeNotes })
        });
        const payload = (await res.json()) as { ok?: boolean; message?: string };
        if (res.ok && payload.ok) {
          await refresh();
          setClosingBalance("");
          setCloseNotes("");
          setFlash({ text: "Caixa fechado com sucesso!", type: "ok" });
          setSaving(false);
          return;
        }
        if (payload.message) {
          setFlash({ text: payload.message, type: "err" });
          setSaving(false);
          return;
        }
      }
    } catch {
      /* fallback */
    }

    // localStorage fallback
    closeCashRegister(openSession.id, balance, closeNotes);
    await refresh();
    setClosingBalance("");
    setCloseNotes("");
    setFlash({ text: "Caixa fechado (modo local).", type: "ok" });
    setSaving(false);
  }

  const closedSessions = sessions.filter((s) => s.status === "closed");

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {flash ? (
        <div className="timer-banner">
          <strong style={{ color: flash.type === "ok" ? "#047857" : "#dc2626" }}>
            {flash.type === "ok" ? "Caixa" : "Erro"}
          </strong>
          <span className="muted">{flash.text}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>
      ) : null}

      {localMode && (
        <div className="timer-banner">
          <strong style={{ color: "#c2410c" }}>Modo local</strong>
          <span className="muted">
            Supabase nao disponivel — dados salvos no navegador. Execute o script <code>supabase/ppb_cash_register_schema.sql</code> para ativar o banco.
          </span>
        </div>
      )}

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Controle de Caixa</h2>
        <p className="muted">
          Abra o caixa no inicio do dia informando o saldo inicial em dinheiro. Feche ao final registrando o saldo de encerramento. O historico fica salvo automaticamente.
        </p>
      </div>

      {/* Status atual */}
      <div className={`card soft`} style={{ borderColor: openSession ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)" }}>
        <div className="section-head">
          <div>
            <span className={`badge ${openSession ? "official" : "community"}`}>
              {openSession ? "Caixa ABERTO" : "Caixa FECHADO"}
            </span>
            <h3 style={{ margin: "10px 0 0" }}>
              {openSession
                ? `Aberto em ${formatDatetime(openSession.openedAt)}`
                : "Nenhum caixa aberto no momento"}
            </h3>
          </div>
          {openSession && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#22c55e" }}>
                {formatBrl(openSession.openingBalance)}
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>saldo de abertura</div>
            </div>
          )}
        </div>
        {openSession?.notes && (
          <p className="muted" style={{ marginTop: 10, fontSize: "0.9rem" }}>
            Obs.: {openSession.notes}
          </p>
        )}
      </div>

      <div className="grid cols-2" style={{ gap: 20 }}>
        {/* Formulario de ABERTURA */}
        <div className="card soft" style={{ opacity: openSession ? 0.5 : 1, pointerEvents: openSession ? "none" : "auto" }}>
          <h3 style={{ marginTop: 0, color: "#22c55e" }}>Abrir caixa</h3>
          <form onSubmit={handleOpen}>
            <div className="field">
              <label htmlFor="opening-balance">Saldo de abertura (R$)</label>
              <input
                id="opening-balance"
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="open-notes">Observacoes (opcional)</label>
              <textarea
                id="open-notes"
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                placeholder="Ex: Troco inicial em caixa, valores pendentes..."
                rows={3}
              />
            </div>
            <div className="inline-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || Boolean(openSession)}
                style={{ background: "#16a34a", borderColor: "#16a34a" }}
              >
                {saving ? "Abrindo..." : "Abrir caixa agora"}
              </button>
            </div>
          </form>
        </div>

        {/* Formulario de FECHAMENTO */}
        <div className="card soft" style={{ opacity: openSession ? 1 : 0.5, pointerEvents: openSession ? "auto" : "none" }}>
          <h3 style={{ marginTop: 0, color: "#ef4444" }}>Fechar caixa</h3>
          {openSession ? (
            <form onSubmit={handleClose}>
              <div className="field">
                <label htmlFor="closing-balance">Saldo de fechamento (R$)</label>
                <input
                  id="closing-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="close-notes">Observacoes (opcional)</label>
                <textarea
                  id="close-notes"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ex: Vendas do dia, divergencias, notas..."
                  rows={3}
                />
              </div>
              <div className="inline-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ background: "#c0392b", borderColor: "#c0392b" }}
                >
                  {saving ? "Fechando..." : "Fechar caixa agora"}
                </button>
              </div>
            </form>
          ) : (
            <p className="muted">Abra um caixa primeiro para poder fechar.</p>
          )}
        </div>
      </div>

      {/* Historico */}
      <div className="card soft">
        <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
          <h2 style={{ margin: 0 }}>Historico de caixas</h2>
          <button type="button" className="btn btn-ghost" onClick={() => void refresh()}>
            Atualizar
          </button>
        </div>

        {closedSessions.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>Nenhum caixa fechado ainda.</p>
        ) : (
          <div className="stack" style={{ marginTop: 14 }}>
            {closedSessions.map((session) => {
              const diff =
                session.closingBalance !== null
                  ? session.closingBalance - session.openingBalance
                  : null;

              return (
                <div key={session.id} className="participant-card">
                  <div>
                    <strong>
                      {new Date(session.date).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </strong>
                    <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>
                      Abertura: {formatBrl(session.openingBalance)} •{" "}
                      Fechamento: {session.closingBalance !== null ? formatBrl(session.closingBalance) : "—"} •{" "}
                      {formatDatetime(session.openedAt)} → {session.closedAt ? formatDatetime(session.closedAt) : "—"}
                    </div>
                    {session.notes && (
                      <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                        {session.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {diff !== null && (
                      <span
                        className={`badge ${diff >= 0 ? "official" : "community"}`}
                        style={{ fontSize: "0.95rem" }}
                      >
                        {diff >= 0 ? "+" : ""}{formatBrl(diff)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
