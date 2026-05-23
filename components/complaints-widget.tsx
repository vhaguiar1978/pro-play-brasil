"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { createComplaint } from "@/lib/complaints-storage";

export function ComplaintsWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setContact("");
    setSubject("");
    setMessage("");
    setError(null);
    setStatus("idle");
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  async function submitComplaint(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanContact = contact.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName) return setError("Informe seu nome.");
    if (!cleanContact) return setError("Informe um contato para resposta.");
    if (!cleanSubject) return setError("Informe o assunto da reclamacao.");
    if (!cleanMessage) return setError("Descreva a reclamacao.");

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pagePath: pathname || "/",
          subject: cleanSubject,
          message: `Nome informado: ${cleanName}\n\n${cleanMessage}`,
          contact: cleanContact
        })
      });

      if (response.ok) {
        setStatus("sent");
        return;
      }
    } catch {
      // fallback local abaixo
    }

    createComplaint({
      pagePath: pathname || "/",
      name: cleanName,
      contact: cleanContact,
      subject: cleanSubject,
      message: cleanMessage
    });

    setStatus("sent");
  }

  return (
    <>
      <div className="complaint-footer-action">
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
          Reclamacao / suporte
        </button>
      </div>

      {open ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Abrir reclamacao">
          <div className="modal">
            <div className="modal-header">
              <div style={{ display: "grid", gap: 6 }}>
                <h2>Enviar reclamacao</h2>
                <p className="muted" style={{ margin: 0 }}>
                  Essa reclamacao fica registrada para o admin com nome, contato e pagina de origem.
                </p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Fechar">
                x
              </button>
            </div>

            <div className="modal-body">
              {status === "sent" ? (
                <div className="timer-banner" style={{ borderColor: "rgba(0, 200, 83, 0.35)" }}>
                  <strong style={{ color: "#047857" }}>Reclamacao enviada</strong>
                  <span className="muted" style={{ color: "#047857" }}>
                    O admin ja consegue ver e responder essa reclamacao dentro do painel.
                  </span>
                </div>
              ) : (
                <form className="stack" onSubmit={submitComplaint}>
                  <div className="field">
                    <label htmlFor="complaint-name">Seu nome</label>
                    <input id="complaint-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="complaint-contact">Contato</label>
                    <input
                      id="complaint-contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="WhatsApp, email ou outro contato"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="complaint-subject">Assunto</label>
                    <input id="complaint-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="complaint-message">Mensagem</label>
                    <textarea id="complaint-message" value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>

                  <p className="muted" style={{ margin: 0 }}>
                    Pagina atual: <strong>{pathname || "/"}</strong>
                  </p>

                  {error ? (
                    <div className="timer-banner" style={{ borderColor: "rgba(255, 82, 82, 0.35)" }}>
                      <strong style={{ color: "#b91c1c" }}>Erro</strong>
                      <span className="muted" style={{ color: "#b91c1c" }}>
                        {error}
                      </span>
                    </div>
                  ) : null}

                  <div className="inline-actions" style={{ justifyContent: "space-between" }}>
                    <button type="button" className="btn btn-ghost" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Enviar reclamacao
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
