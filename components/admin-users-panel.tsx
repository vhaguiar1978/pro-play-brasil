"use client";

import { useEffect, useState } from "react";
import { readUserRegistry, updateUserRegistryStatus, type UserRegistryStatus } from "@/lib/user-registry";

type AdminUserRecord = {
  id: string;
  full_name: string;
  cpf: string | null;
  email: string;
  gamertag: string;
  whatsapp: string;
  platform: "PC" | "PlayStation" | "Xbox" | "Mobile" | "Crossplay";
  created_at: string;
  updated_at: string;
  status: UserRegistryStatus;
  penalty_reason: string;
  is_admin: boolean;
};

function duplicateSnapshot(user: AdminUserRecord, users: AdminUserRecord[]) {
  const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
  const onlyDigits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

  const sameCpf = users.filter((item) => item.id !== user.id && onlyDigits(item.cpf) && onlyDigits(item.cpf) === onlyDigits(user.cpf)).length;
  const sameEmail = users.filter((item) => item.id !== user.id && normalizeText(item.email) === normalizeText(user.email)).length;
  const sameGamertag = users.filter((item) => item.id !== user.id && normalizeText(item.gamertag) === normalizeText(user.gamertag)).length;

  return {
    sameCpf,
    sameEmail,
    sameGamertag,
    riskLevel: sameCpf > 0 || sameEmail > 0 ? "high" : sameGamertag > 0 ? "medium" : "low"
  } as const;
}

function readLocalUsers(): AdminUserRecord[] {
  return readUserRegistry().map((user) => ({
    id: user.id,
    full_name: user.fullName,
    cpf: user.cpf,
    email: user.email,
    gamertag: user.gamertag,
    whatsapp: user.whatsapp,
    platform: user.platform,
    created_at: user.createdAt,
    updated_at: user.lastSeenAt,
    status: user.status,
    penalty_reason: user.penaltyReason,
    is_admin: false
  }));
}

function buildWhatsAppLink(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; users?: AdminUserRecord[] };

      if (response.ok && payload.ok && Array.isArray(payload.users)) {
        setUsers(payload.users);
        return;
      }
    } catch {
      // fallback local abaixo
    }

    setUsers(readLocalUsers());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveStatus(userId: string, status: UserRegistryStatus, reason: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, penaltyReason: reason })
      });

      if (response.ok) {
        await refresh();
        setFlash("Controle de usuario atualizado.");
        return;
      }
    } catch {
      // fallback local abaixo
    }

    updateUserRegistryStatus(userId, status, reason);
    await refresh();
    setFlash("Controle de usuario atualizado.");
  }

  async function deleteUser(userId: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await refresh();
        setFlash("Usuario excluido com sucesso.");
        setConfirmDeleteId(null);
        return;
      }
    } catch {
      // fallback: remove from local list
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setFlash("Usuario removido da lista local.");
    setConfirmDeleteId(null);
  }

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {flash ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>Usuarios</strong>
          <span className="muted">{flash}</span>
        </div>
      ) : null}

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Usuarios cadastrados</h2>
        <p className="muted">
          Este painel ajuda a enxergar duplicidade por CPF, email ou gamertag e aplicar penalizacao, bloqueio ou exclusao quando necessario.
        </p>
      </div>

      {/* Modal de confirmacao de exclusao */}
      {confirmDeleteId ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div className="card soft" style={{ maxWidth: 420, width: "90%", textAlign: "center" }}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Confirmar exclusao</h3>
            <p className="muted">
              Esta acao e irreversivel. O usuario e todos os seus dados (PPC, saques, inscricoes) serao permanentemente removidos.
            </p>
            <div className="inline-actions" style={{ justifyContent: "center", marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#c0392b", borderColor: "#c0392b" }}
                onClick={() => void deleteUser(confirmDeleteId)}
              >
                Sim, excluir permanentemente
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {users.length === 0 ? (
        <div className="card soft">
          <p className="muted" style={{ margin: 0 }}>Ainda nao ha usuarios registrados no sistema.</p>
        </div>
      ) : (
        users.map((user) => {
          const duplicate = duplicateSnapshot(user, users);
          const waLink = buildWhatsAppLink(user.whatsapp);
          const isHovered = hoveredId === user.id;

          return (
            <form
              key={user.id}
              className="card soft"
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredId(user.id)}
              onMouseLeave={() => setHoveredId(null)}
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void saveStatus(
                  user.id,
                  String(form.get("status") ?? "active") as UserRegistryStatus,
                  String(form.get("reason") ?? "")
                );
              }}
            >
              {/* Botao lixeira — aparece so no hover */}
              {isHovered && (
                <button
                  type="button"
                  title="Excluir usuario"
                  onClick={() => setConfirmDeleteId(user.id)}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "rgba(192,57,43,0.15)",
                    border: "1px solid rgba(192,57,43,0.4)",
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                    color: "#e74c3c",
                    fontSize: "1.1rem",
                    lineHeight: 1,
                    transition: "background 0.15s"
                  }}
                >
                  🗑️
                </button>
              )}

              <div className="section-head">
                <div>
                  <span className={`badge ${user.status === "active" ? "official" : "community"}`}>
                    {user.status === "active" ? "Ativo" : user.status === "penalized" ? "Penalizado" : "Banido"}
                  </span>
                  <h2 style={{ margin: "14px 0 6px" }}>{user.gamertag}</h2>
                  <p className="muted" style={{ margin: 0 }}>
                    {user.full_name} • {user.email} • {user.platform}
                  </p>
                </div>

                {/* Botao WhatsApp */}
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", gap: 6, flexShrink: 0 }}
                    title={`Abrir WhatsApp: ${user.whatsapp}`}
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>

              <div className="grid cols-3" style={{ marginTop: 16 }}>
                <div className="participant-card">
                  <div>
                    <strong>CPF repetido</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>{duplicate.sameCpf} ocorrencias extras</div>
                  </div>
                  <span className={`badge ${duplicate.sameCpf > 0 ? "community" : "official"}`}>{duplicate.sameCpf > 0 ? "Risco" : "Ok"}</span>
                </div>
                <div className="participant-card">
                  <div>
                    <strong>Email repetido</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>{duplicate.sameEmail} ocorrencias extras</div>
                  </div>
                  <span className={`badge ${duplicate.sameEmail > 0 ? "community" : "official"}`}>{duplicate.sameEmail > 0 ? "Risco" : "Ok"}</span>
                </div>
                <div className="participant-card">
                  <div>
                    <strong>Gamertag repetido</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>{duplicate.sameGamertag} ocorrencias extras</div>
                  </div>
                  <span className={`badge ${duplicate.sameGamertag > 0 ? "community" : "official"}`}>{duplicate.sameGamertag > 0 ? "Atencao" : "Ok"}</span>
                </div>
              </div>

              <div className="grid cols-2" style={{ marginTop: 16 }}>
                <div className="stack">
                  <div className="participant-card">
                    <div>
                      <strong>Conta cadastrada em</strong>
                      <div className="muted" style={{ fontSize: "0.9rem" }}>
                        {new Date(user.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <span className="badge">{duplicate.riskLevel}</span>
                  </div>
                  <div className="participant-card">
                    <div>
                      <strong>Ultima atualizacao</strong>
                      <div className="muted" style={{ fontSize: "0.9rem" }}>
                        {new Date(user.updated_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <span className="badge community">{user.is_admin ? "Admin" : "User"}</span>
                  </div>
                </div>

                <div className="stack">
                  <div className="field">
                    <label htmlFor={`status-${user.id}`}>Status do usuario</label>
                    <select id={`status-${user.id}`} name="status" defaultValue={user.status}>
                      <option value="active">Ativo</option>
                      <option value="penalized">Penalizado</option>
                      <option value="banned">Banido</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`reason-${user.id}`}>Motivo / observacao</label>
                    <textarea
                      id={`reason-${user.id}`}
                      name="reason"
                      defaultValue={user.penalty_reason}
                      placeholder="Explique aqui o motivo da penalizacao ou bloqueio..."
                    />
                  </div>
                </div>
              </div>

              <div className="inline-actions">
                <button type="submit" className="btn btn-primary">
                  Salvar controle
                </button>
              </div>
            </form>
          );
        })
      )}
    </div>
  );
}
