"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GAMES } from "@/lib/games";
import {
  type MockTournament,
  type TournamentFormat,
  type TournamentOrigin,
  type TournamentStatus,
  deleteCustomTournament,
  formatLabel,
  readCustomTournaments,
  upsertCustomTournament
} from "@/lib/mock-tournaments";

const PLATFORMS = ["PC", "PS5", "PS4", "Xbox Series", "Xbox One", "Mobile", "PC e Console"];
const REGIONS = ["Nacional", "Sul", "Sudeste", "Norte", "Nordeste", "Centro-Oeste"];
const FORMATS: { value: TournamentFormat; label: string }[] = [
  { value: "eliminacao", label: "Mata-mata" },
  { value: "grupos", label: "Grupos + mata-mata" },
  { value: "pontos", label: "Pontos corridos" }
];
const STATUSES: { value: TournamentStatus; label: string }[] = [
  { value: "open", label: "Aberto" },
  { value: "live", label: "Em andamento" },
  { value: "finished", label: "Finalizado" }
];

const EMPTY_FORM = {
  name: "",
  gameSlug: GAMES[0].slug,
  origin: "official" as TournamentOrigin,
  platform: PLATFORMS[0],
  format: "eliminacao" as TournamentFormat,
  status: "open" as TournamentStatus,
  maxPlayers: 8,
  startDate: "",
  regionLabel: REGIONS[0],
  prize: "",
  feeLabel: "",
  description: ""
};

function generateId(): string {
  return "adm-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

export function AdminTournamentsPanel() {
  const [tournaments, setTournaments] = useState<MockTournament[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTournaments(readCustomTournaments());
  }, []);

  function refresh() {
    setTournaments(readCustomTournaments());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const tournament: MockTournament = {
      id: generateId(),
      name: form.name.trim(),
      gameSlug: form.gameSlug,
      origin: form.origin,
      description: form.description.trim(),
      platform: form.platform,
      format: form.format,
      status: form.status,
      maxPlayers: Number(form.maxPlayers),
      registered: 0,
      startDate: form.startDate,
      feeLabel: form.feeLabel.trim() || null,
      prize: form.prize.trim(),
      regionLabel: form.regionLabel,
      participants: []
    };

    upsertCustomTournament(tournament);
    refresh();
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleDelete(id: string) {
    deleteCustomTournament(id);
    setConfirmDelete(null);
    refresh();
  }

  function set(field: keyof typeof EMPTY_FORM, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <section className="card soft" style={{ marginTop: 24 }}>
      <div className="section-head">
        <div>
          <span className="badge official">Gerenciar campeonatos</span>
          <h2 style={{ margin: "8px 0 0" }}>Campeonatos cadastrados</h2>
          <p className="muted" style={{ marginTop: 4 }}>
            Crie e exclua campeonatos sem custo. As inscrições ficam gratuitas para os jogadores.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
          type="button"
        >
          {showForm ? "Cancelar" : "+ Novo campeonato"}
        </button>
      </div>

      {saved && (
        <div className="card" style={{ background: "var(--color-success, #16a34a)", color: "#fff", marginTop: 16 }}>
          Campeonato criado com sucesso.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Novo campeonato</h3>

          <div className="grid cols-2" style={{ gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Nome *</label>
              <input
                className="input"
                type="text"
                required
                placeholder="Ex: Copa Pro Play EA FC"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Jogo *</label>
              <select
                className="input"
                required
                value={form.gameSlug}
                onChange={(e) => set("gameSlug", e.target.value)}
                style={{ width: "100%" }}
              >
                {GAMES.map((g) => (
                  <option key={g.slug} value={g.slug}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Tipo *</label>
              <select
                className="input"
                required
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="official">Oficial Pro Play</option>
                <option value="community">Comunidade</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Plataforma *</label>
              <select
                className="input"
                required
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
                style={{ width: "100%" }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Formato *</label>
              <select
                className="input"
                required
                value={form.format}
                onChange={(e) => set("format", e.target.value)}
                style={{ width: "100%" }}
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Status *</label>
              <select
                className="input"
                required
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                style={{ width: "100%" }}
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Vagas *</label>
              <input
                className="input"
                type="number"
                required
                min={2}
                max={128}
                value={form.maxPlayers}
                onChange={(e) => set("maxPlayers", Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Data de inicio *</label>
              <input
                className="input"
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Regiao *</label>
              <select
                className="input"
                required
                value={form.regionLabel}
                onChange={(e) => set("regionLabel", e.target.value)}
                style={{ width: "100%" }}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Premiacao *</label>
              <input
                className="input"
                type="text"
                required
                placeholder="Ex: 500 PPC + troféu"
                value={form.prize}
                onChange={(e) => set("prize", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Valor da inscricao por atleta</label>
              <input
                className="input"
                type="text"
                placeholder="Ex: R$ 20,00 — deixe vazio para gratuito"
                value={form.feeLabel}
                onChange={(e) => set("feeLabel", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Descricao</label>
              <input
                className="input"
                type="text"
                placeholder="Opcional"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="inline-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-primary" type="submit">
              Criar campeonato
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {tournaments.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          Nenhum campeonato cadastrado ainda. Clique em &quot;+ Novo campeonato&quot; para comecar.
        </p>
      ) : (
        <div className="stack" style={{ marginTop: 20 }}>
          {tournaments.map((t) => (
            <div key={t.id} className="participant-card">
              <div>
                <strong>{t.name}</strong>
                <div className="muted" style={{ fontSize: "0.875rem", marginTop: 2 }}>
                  {GAMES.find((g) => g.slug === t.gameSlug)?.name ?? t.gameSlug} · {t.platform} · {t.regionLabel} · {formatLabel(t.format)} · {t.registered}/{t.maxPlayers} inscritos
                </div>
                <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
                  Inicio: {new Date(t.startDate).toLocaleString("pt-BR")} · Premiacao: {t.prize}
                </div>
              </div>

              <div className="inline-actions" style={{ gap: 8 }}>
                <Link href={`/campeonatos/${t.id}`} className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                  Ver
                </Link>
                {confirmDelete === t.id ? (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: "0.8rem", padding: "4px 10px", background: "var(--color-danger, #dc2626)" }}
                      onClick={() => handleDelete(t.id)}
                      type="button"
                    >
                      Confirmar exclusao
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                      onClick={() => setConfirmDelete(null)}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                    onClick={() => setConfirmDelete(t.id)}
                    type="button"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
