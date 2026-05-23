"use client";

import { useEffect, useState } from "react";
import { readComplaints, replyComplaint, type ComplaintTicket } from "@/lib/complaints-storage";

type AdminComplaintRecord = {
  id: string;
  nickname: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  status: "aberta" | "respondida" | "encerrada";
  admin_reply: string;
  created_at: string;
  updated_at: string;
};

function getContactLink(contact: string) {
  const clean = contact.trim();
  if (!clean) return null;
  if (clean.includes("@")) return `mailto:${clean}`;

  const digits = clean.replace(/\D/g, "");
  if (digits.length >= 10) return `https://wa.me/55${digits}`;
  return null;
}

function toLocalComplaint(complaint: ComplaintTicket): AdminComplaintRecord {
  return {
    id: complaint.id,
    nickname: complaint.name,
    full_name: complaint.name,
    email: complaint.contact,
    subject: complaint.subject,
    message: complaint.message,
    status: complaint.status,
    admin_reply: complaint.adminReply,
    created_at: complaint.createdAt,
    updated_at: complaint.repliedAt ?? complaint.createdAt
  };
}

export function AdminComplaintsPanel() {
  const [complaints, setComplaints] = useState<AdminComplaintRecord[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch("/api/complaints", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; complaints?: AdminComplaintRecord[] };

      if (response.ok && payload.ok && Array.isArray(payload.complaints)) {
        setComplaints(payload.complaints);
        return;
      }
    } catch {
      // fallback local abaixo
    }

    setComplaints(readComplaints().map(toLocalComplaint));
  }

  useEffect(() => {
    refresh();
  }, []);

  const contactLink = (contact: string) => getContactLink(contact);

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {flash ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>Reclamacoes</strong>
          <span className="muted">{flash}</span>
        </div>
      ) : null}

      {complaints.length === 0 ? (
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Reclamacoes</h2>
          <p className="muted">Ainda nao houve reclamacoes enviadas pelo botao do rodape.</p>
        </div>
      ) : (
        complaints.map((complaint) => (
          <form
            key={complaint.id}
            className="card soft"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const reply = String(form.get("reply") ?? "").trim();
              if (!reply) return;

              void (async () => {
                try {
                  const response = await fetch(`/api/complaints/${complaint.id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ reply })
                  });

                  if (response.ok) {
                    await refresh();
                    setFlash(`Resposta salva para ${complaint.full_name || complaint.nickname}.`);
                    return;
                  }
                } catch {
                  // fallback local abaixo
                }

                replyComplaint(complaint.id, reply);
                await refresh();
                setFlash(`Resposta salva para ${complaint.full_name || complaint.nickname}.`);
              })();
            }}
          >
            <div className="section-head">
              <div>
                <span className={`badge ${complaint.status === "respondida" ? "official" : "community"}`}>
                  {complaint.status === "respondida" ? "Respondida" : "Aberta"}
                </span>
                <h2 style={{ margin: "14px 0 6px" }}>{complaint.subject}</h2>
                <p className="muted" style={{ margin: 0 }}>
                  {complaint.full_name || complaint.nickname} • {complaint.email || "sem email"}
                </p>
              </div>
            </div>

            <p style={{ marginTop: 16, whiteSpace: "pre-line" }}>{complaint.message}</p>

            <div className="grid cols-2">
              <div className="field">
                <label htmlFor={`reply-${complaint.id}`}>Responder dentro do sistema</label>
                <textarea
                  id={`reply-${complaint.id}`}
                  name="reply"
                  defaultValue={complaint.admin_reply}
                  placeholder="Digite aqui a resposta para a pessoa..."
                />
              </div>
              <div className="stack">
                <div className="participant-card">
                  <div>
                    <strong>Contato para retorno</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {complaint.email || "Sem contato"}
                    </div>
                  </div>
                  {contactLink(complaint.email) ? (
                    <a className="btn btn-ghost" href={contactLink(complaint.email) ?? "#"} target="_blank" rel="noreferrer">
                      Responder direto
                    </a>
                  ) : (
                    <span className="badge">Direto</span>
                  )}
                </div>
                <div className="participant-card">
                  <div>
                    <strong>Enviada em</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {new Date(complaint.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span className="badge community">Registro</span>
                </div>
                <div className="participant-card">
                  <div>
                    <strong>Ultima atualizacao</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {new Date(complaint.updated_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span className="badge official">Sistema</span>
                </div>
              </div>
            </div>

            <div className="inline-actions">
              <button type="submit" className="btn btn-primary">
                Salvar resposta
              </button>
            </div>
          </form>
        ))
      )}
    </div>
  );
}
