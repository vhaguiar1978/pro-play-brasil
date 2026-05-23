"use client";

import { useEffect, useMemo, useState } from "react";
import { GAMES } from "@/lib/games";
import {
  applyTournamentAutomation,
  readTournamentAutomationSettings,
  writeTournamentAutomationSettings,
  type TournamentAutomationReport,
  type TournamentAutomationRule,
  type TournamentAutomationSettings
} from "@/lib/tournament-automation";
import { MOCK_TOURNAMENTS, readCustomTournaments } from "@/lib/mock-tournaments";

type FormStatus = "idle" | "saved";

function cloneSettings(settings: TournamentAutomationSettings): TournamentAutomationSettings {
  return {
    autoCreateEnabled: settings.autoCreateEnabled,
    autoCleanupEnabled: settings.autoCleanupEnabled,
    cleanupIncludesManual: settings.cleanupIncludesManual,
    games: settings.games.map((rule) => ({ ...rule }))
  };
}

export function AdminTournamentAutomationPanel() {
  const [settings, setSettings] = useState<TournamentAutomationSettings | null>(null);
  const [report, setReport] = useState<TournamentAutomationReport | null>(null);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");

  useEffect(() => {
    const loadedSettings = readTournamentAutomationSettings();
    setSettings(cloneSettings(loadedSettings));

    const result = applyTournamentAutomation(readCustomTournaments(), MOCK_TOURNAMENTS);
    setReport(result.report);
  }, []);

  const enabledGames = useMemo(() => settings?.games.filter((rule) => rule.enabled).length ?? 0, [settings]);

  function patchRule(gameSlug: string, updater: (rule: TournamentAutomationRule) => TournamentAutomationRule) {
    setSettings((current) => {
      if (!current) return current;

      return {
        ...current,
        games: current.games.map((rule) => (rule.gameSlug === gameSlug ? updater(rule) : rule))
      };
    });
  }

  function saveSettings() {
    if (!settings) return;

    writeTournamentAutomationSettings(settings);
    const result = applyTournamentAutomation(readCustomTournaments(), MOCK_TOURNAMENTS);
    setReport(result.report);
    setFormStatus("saved");
    window.setTimeout(() => setFormStatus("idle"), 2500);
  }

  function runNow() {
    if (settings) {
      writeTournamentAutomationSettings(settings);
    }

    const result = applyTournamentAutomation(readCustomTournaments(), MOCK_TOURNAMENTS);
    setReport(result.report);
  }

  if (!settings) {
    return null;
  }

  return (
    <section className="card soft" style={{ marginTop: 24 }}>
      <div className="section-head">
        <div>
          <span className="badge official">Automacao de campeonatos</span>
          <h2 style={{ margin: "8px 0 0" }}>Agenda automatica por jogo</h2>
          <p className="muted" style={{ marginTop: 4 }}>
            O sistema pode manter campeonatos futuros ativos e limpar eventos passados sem inscritos para todas as modalidades.
          </p>
        </div>
        <div className="inline-actions">
          <button className="btn btn-secondary" type="button" onClick={runNow}>
            Rodar agora
          </button>
          <button className="btn btn-primary" type="button" onClick={saveSettings}>
            Salvar configuracao
          </button>
        </div>
      </div>

      {formStatus === "saved" ? (
        <div className="card" style={{ background: "#166534", color: "#fff", marginTop: 16 }}>
          Configuracao salva com sucesso.
        </div>
      ) : null}

      <div className="grid cols-3" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Criacao automatica</h3>
          <p className="muted">{settings.autoCreateEnabled ? "Ativa" : "Pausada"}</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Jogos ativos</h3>
          <p className="muted">{enabledGames} modalidades com automacao ligada.</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ultima execucao</h3>
          <p className="muted">
            {report ? `${report.created} criados e ${report.deleted} excluidos.` : "Ainda sem execucao registrada."}
          </p>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 20 }}>
        <label className="participant-card" style={{ cursor: "pointer" }}>
          <div>
            <strong>Ativar criacao automatica</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              Mantem campeonatos futuros prontos em todas as modalidades marcadas.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoCreateEnabled}
            onChange={(event) =>
              setSettings((current) => (current ? { ...current, autoCreateEnabled: event.target.checked } : current))
            }
          />
        </label>

        <label className="participant-card" style={{ cursor: "pointer" }}>
          <div>
            <strong>Excluir sem inscritos</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              Remove campeonatos passados sem qualquer inscricao.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoCleanupEnabled}
            onChange={(event) =>
              setSettings((current) => (current ? { ...current, autoCleanupEnabled: event.target.checked } : current))
            }
          />
        </label>

        <label className="participant-card" style={{ cursor: "pointer" }}>
          <div>
            <strong>Limpar tambem os manuais</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              Se desligado, a limpeza vale apenas para campeonatos criados automaticamente.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.cleanupIncludesManual}
            onChange={(event) =>
              setSettings((current) => (current ? { ...current, cleanupIncludesManual: event.target.checked } : current))
            }
          />
        </label>
      </div>

      <div className="stack" style={{ marginTop: 20 }}>
        {settings.games.map((rule) => {
          const game = GAMES.find((item) => item.slug === rule.gameSlug);

          return (
            <div key={rule.gameSlug} className="card">
              <div className="section-head">
                <div>
                  <h3 style={{ margin: 0 }}>{game?.name ?? rule.gameSlug}</h3>
                  <p className="muted" style={{ marginTop: 6 }}>
                    Controle nome base, formato, premio e frequencia dessa modalidade.
                  </p>
                </div>
                <label className="inline-actions" style={{ gap: 10, alignItems: "center" }}>
                  <span className="muted">Ativo</span>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, enabled: event.target.checked }))
                    }
                  />
                </label>
              </div>

              <div className="grid cols-2" style={{ marginTop: 16, gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Nome base</label>
                  <input
                    className="input"
                    type="text"
                    value={rule.titleBase}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, titleBase: event.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Plataforma</label>
                  <input
                    className="input"
                    type="text"
                    value={rule.platform}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, platform: event.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Formato</label>
                  <select
                    className="input"
                    value={rule.format}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({
                        ...current,
                        format: event.target.value as TournamentAutomationRule["format"]
                      }))
                    }
                    style={{ width: "100%" }}
                  >
                    <option value="eliminacao">Mata-mata</option>
                    <option value="grupos">Grupos + mata-mata</option>
                    <option value="pontos">Pontos corridos</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Taxa</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Deixe vazio para gratuito"
                    value={rule.feeLabel}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, feeLabel: event.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Premio</label>
                  <input
                    className="input"
                    type="text"
                    value={rule.prize}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, prize: event.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Regiao</label>
                  <input
                    className="input"
                    type="text"
                    value={rule.regionLabel}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, regionLabel: event.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Vagas</label>
                  <input
                    className="input"
                    type="number"
                    min={2}
                    max={256}
                    value={rule.maxPlayers}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, maxPlayers: Number(event.target.value) || 2 }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Minimo por time</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={64}
                    value={rule.minimumPlayers}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({
                        ...current,
                        minimumPlayers: Number(event.target.value) || 1
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Antecedencia (dias)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={120}
                    value={rule.leadDays}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, leadDays: Number(event.target.value) || 1 }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Frequencia (dias)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={120}
                    value={rule.cadenceDays}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({
                        ...current,
                        cadenceDays: Number(event.target.value) || 1
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Quantos manter abertos</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={8}
                    value={rule.keepUpcomingCount}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({
                        ...current,
                        keepUpcomingCount: Number(event.target.value) || 1
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Horario</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={23}
                      value={rule.startHour}
                      onChange={(event) =>
                        patchRule(rule.gameSlug, (current) => ({ ...current, startHour: Number(event.target.value) || 0 }))
                      }
                    />
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={59}
                      value={rule.startMinute}
                      onChange={(event) =>
                        patchRule(rule.gameSlug, (current) => ({
                          ...current,
                          startMinute: Number(event.target.value) || 0
                        }))
                      }
                    />
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Descricao padrao</label>
                  <textarea
                    className="input"
                    value={rule.description}
                    onChange={(event) =>
                      patchRule(rule.gameSlug, (current) => ({ ...current, description: event.target.value }))
                    }
                    style={{ width: "100%", minHeight: 90 }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
