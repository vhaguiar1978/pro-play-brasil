"use client";

import { useEffect, useRef, useState } from "react";

type CrmLabel = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

const PRESET_COLORS = [
  "#ff6a00", // brand orange
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#6b7280", // gray
];

export function AdminCrmLabelsPanel() {
  const [labels, setLabels] = useState<CrmLabel[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#ff6a00");
  const [saving, setSaving] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/admin/crm-labels", { cache: "no-store" });
      const payload = (await res.json()) as { ok?: boolean; labels?: CrmLabel[] };
      if (res.ok && payload.ok && Array.isArray(payload.labels)) {
        setLabels(payload.labels);
        return;
      }
    } catch {
      // sem Supabase — usa localStorage
    }

    setLocalMode(true);
    const stored = localStorage.getItem("ppb_crm_labels");
    setLabels(stored ? (JSON.parse(stored) as CrmLabel[]) : []);
  }

  function saveLocal(updated: CrmLabel[]) {
    localStorage.setItem("ppb_crm_labels", JSON.stringify(updated));
    setLabels(updated);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setSaving(true);
    try {
      if (!localMode) {
        const res = await fetch("/api/admin/crm-labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color: newColor })
        });
        if (res.ok) {
          await refresh();
          setNewName("");
          setFlash(`Etiqueta "${name}" criada com sucesso.`);
          nameRef.current?.focus();
          setSaving(false);
          return;
        }
      }
    } catch {
      /* fallback */
    }

    // localStorage fallback
    const created: CrmLabel = {
      id: crypto.randomUUID(),
      name,
      color: newColor,
      created_at: new Date().toISOString()
    };
    saveLocal([...labels, created].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
    setFlash(`Etiqueta "${name}" criada.`);
    nameRef.current?.focus();
    setSaving(false);
  }

  async function handleDelete(label: CrmLabel) {
    try {
      if (!localMode) {
        const res = await fetch(`/api/admin/crm-labels/${label.id}`, { method: "DELETE" });
        if (res.ok) {
          await refresh();
          setFlash(`Etiqueta "${label.name}" removida.`);
          return;
        }
      }
    } catch {
      /* fallback */
    }

    saveLocal(labels.filter((l) => l.id !== label.id));
    setFlash(`Etiqueta "${label.name}" removida.`);
  }

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {flash ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>Etiquetas CRM</strong>
          <span className="muted">{flash}</span>
        </div>
      ) : null}

      {localMode && (
        <div className="timer-banner">
          <strong style={{ color: "#c2410c" }}>Modo local</strong>
          <span className="muted">Supabase nao disponivel — etiquetas salvas no navegador. Execute o script SQL para ativar o banco.</span>
        </div>
      )}

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Etiquetas de clientes</h2>
        <p className="muted">
          Crie etiquetas para classificar seus usuarios: VIP, Suspeito, Parceiro, Influencer, etc. As etiquetas aparecem no painel de usuarios.
        </p>
      </div>

      {/* Formulario de criacao */}
      <div className="card soft">
        <h3 style={{ marginTop: 0 }}>Nova etiqueta</h3>
        <form onSubmit={handleCreate}>
          <div className="grid cols-2" style={{ gap: 16, alignItems: "flex-end" }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="label-name">Nome da etiqueta</label>
              <input
                ref={nameRef}
                id="label-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: VIP, Suspeito, Parceiro..."
                maxLength={40}
                required
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Cor</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setNewColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c,
                      border: newColor === c ? "3px solid white" : "2px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      flexShrink: 0
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  title="Cor personalizada"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.2)",
                    cursor: "pointer",
                    padding: 2,
                    background: "transparent"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {newName.trim() && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Preview:</span>
              <span
                style={{
                  background: `${newColor}22`,
                  border: `1px solid ${newColor}66`,
                  color: newColor,
                  borderRadius: 20,
                  padding: "3px 12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em"
                }}
              >
                {newName.trim()}
              </span>
            </div>
          )}

          <div className="inline-actions" style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !newName.trim()}>
              {saving ? "Criando..." : "Criar etiqueta"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de etiquetas existentes */}
      <div className="card soft">
        <h3 style={{ marginTop: 0 }}>Etiquetas cadastradas ({labels.length})</h3>

        {labels.length === 0 ? (
          <p className="muted">Nenhuma etiqueta criada ainda. Crie a primeira acima.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {labels.map((label) => (
              <div
                key={label.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: `${label.color}18`,
                  border: `1px solid ${label.color}50`,
                  borderRadius: 20,
                  padding: "5px 14px 5px 10px"
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: label.color,
                    flexShrink: 0
                  }}
                />
                <span style={{ color: label.color, fontWeight: 700, fontSize: "0.85rem" }}>
                  {label.name}
                </span>
                <button
                  type="button"
                  title="Remover etiqueta"
                  onClick={() => void handleDelete(label)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.9rem",
                    lineHeight: 1,
                    padding: 0,
                    marginLeft: 2
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card soft">
        <h3 style={{ marginTop: 0 }}>Como ativar no banco de dados</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Para que as etiquetas sejam persistidas no Supabase, execute o script SQL abaixo no Supabase SQL Editor do seu projeto.
        </p>
        <code
          style={{
            display: "block",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: "0.8rem",
            color: "#047857",
            fontFamily: "monospace",
            lineHeight: 1.6
          }}
        >
          {`-- Arquivo: supabase/ppb_crm_labels_schema.sql\n-- Execute no Supabase Dashboard → SQL Editor`}
        </code>
      </div>
    </div>
  );
}
