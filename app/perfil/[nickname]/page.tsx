"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { getPlayerHistory, type PlayerHistoryEntry } from "@/lib/player-history";
import { readArenaProfile } from "@/lib/profile-storage";

type Props = { params: Promise<{ nickname: string }> };

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function PerfilPage({ params }: Props) {
  const { nickname } = use(params);
  const decoded = decodeURIComponent(nickname);
  const [history, setHistory] = useState<PlayerHistoryEntry[]>([]);
  const [platformLabel, setPlatformLabel] = useState("Nao informado");

  useEffect(() => {
    setHistory(getPlayerHistory(decoded));
    setPlatformLabel(readArenaProfile()?.platform || "Nao informado");
  }, [decoded]);

  const wins = useMemo(
    () => history.filter((entry) => /venceu|campeao|classificado|segue vivo/i.test(entry.resultLabel + entry.campaignLabel)).length,
    [history]
  );
  const eliminations = useMemo(
    () => history.filter((entry) => /eliminado/i.test(entry.campaignLabel)).length,
    [history]
  );
  const titles = useMemo(
    () => history.filter((entry) => /campeao/i.test(entry.campaignLabel)).length,
    [history]
  );
  const lastEntry = history[0];

  return (
    <div className="page">
      <section className="page-hero">
        <span className="badge">Perfil competitivo</span>
        <h1>{decoded}</h1>
        <p className="muted">
          Aqui o jogador acompanha quando jogou, em qual campeonato entrou, o horario da partida e se foi eliminado ou chegou ao titulo.
        </p>
      </section>

      <div className="grid cols-4">
        <div className="card soft">
          <h3 style={{ marginTop: 0 }}>Partidas no historico</h3>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "8px 0 0" }}>{history.length}</p>
          <p className="muted">Eventos salvos neste navegador para esse perfil.</p>
        </div>
        <div className="card soft">
          <h3 style={{ marginTop: 0 }}>Titulos</h3>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "8px 0 0" }}>{titles}</p>
          <p className="muted">Campanhas encerradas como campeao.</p>
        </div>
        <div className="card soft">
          <h3 style={{ marginTop: 0 }}>Campanhas vencidas</h3>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "8px 0 0" }}>{wins}</p>
          <p className="muted">Resultados positivos e classificacoes registradas.</p>
        </div>
        <div className="card soft">
          <h3 style={{ marginTop: 0 }}>Eliminacoes</h3>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "8px 0 0" }}>{eliminations}</p>
          <p className="muted">Quedas em mata-mata ou fim de campanha.</p>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Resumo do jogador</h2>
          <div className="stack" style={{ gap: 12 }}>
            <div className="participant-card">
              <div>
                <strong>Gamertag</strong>
                <div className="muted" style={{ fontSize: "0.92rem" }}>{decoded}</div>
              </div>
              <span className="badge">Perfil</span>
            </div>
            <div className="participant-card">
              <div>
                <strong>Plataforma</strong>
                <div className="muted" style={{ fontSize: "0.92rem" }}>{platformLabel}</div>
              </div>
              <span className="badge official">Base</span>
            </div>
            <div className="participant-card">
              <div>
                <strong>Ultima atualizacao</strong>
                <div className="muted" style={{ fontSize: "0.92rem" }}>
                  {lastEntry ? formatDateTime(lastEntry.playedAt) : "Sem partidas registradas"}
                </div>
              </div>
              <span className="badge community">Historico</span>
            </div>
          </div>
        </div>

        <div className="card soft" style={{ gridColumn: "span 2" }}>
          <h2 style={{ marginTop: 0 }}>Ultima campanha</h2>
          {lastEntry ? (
            <div className="grid cols-2" style={{ gap: 12 }}>
              <div className="participant-card">
                <div>
                  <strong>{lastEntry.tournamentName}</strong>
                  <div className="muted" style={{ fontSize: "0.92rem" }}>{lastEntry.roundLabel}</div>
                </div>
                <span className="badge">{formatDateTime(lastEntry.playedAt)}</span>
              </div>
              <div className="participant-card">
                <div>
                  <strong>{lastEntry.resultLabel}</strong>
                  <div className="muted" style={{ fontSize: "0.92rem" }}>{lastEntry.campaignLabel}</div>
                </div>
                <span className="badge official">Status</span>
              </div>
            </div>
          ) : (
            <p className="muted">
              Quando esse jogador entrar em campeonato, disputar partidas ou finalizar uma campanha, o resumo aparece aqui.
            </p>
          )}
        </div>
      </div>

      <div className="card soft" style={{ marginTop: 16 }}>
        <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
          <div>
            <h2 style={{ margin: 0 }}>Historico de partidas e campeonatos</h2>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              Cada linha mostra o dia, hora, campeonato, fase e o desfecho do jogador.
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setHistory(getPlayerHistory(decoded))}>
            Atualizar
          </button>
        </div>

        {history.length === 0 ? (
          <p className="muted" style={{ marginTop: 16 }}>
            Nenhum registro encontrado ainda para esse jogador.
          </p>
        ) : (
          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Campeonato</th>
                  <th>Data e hora</th>
                  <th>Fase</th>
                  <th>Resultado</th>
                  <th>Campanha</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.tournamentName}</td>
                    <td>{formatDateTime(entry.playedAt)}</td>
                    <td>{entry.roundLabel}</td>
                    <td>{entry.resultLabel}</td>
                    <td>{entry.campaignLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="inline-actions">
        <Link href="/arena/moedas" className="btn btn-primary">
          Ver PPC
        </Link>
        <Link href="/ranking" className="btn btn-secondary">
          Ir ao ranking
        </Link>
      </div>
    </div>
  );
}
