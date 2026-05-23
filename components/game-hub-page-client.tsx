"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRankingByGameSlug } from "@/lib/mock-rankings";
import { getTournamentsByGameSlug } from "@/lib/mock-tournaments";
import { getManagedGameHubBySlug, type ManagedGameHub } from "@/lib/managed-game-hubs";

type Props = {
  slug: string;
};

export function GameHubPageClient({ slug }: Props) {
  const [hub, setHub] = useState<ManagedGameHub | null>(null);

  useEffect(() => {
    const currentHub = getManagedGameHubBySlug(slug);
    setHub(currentHub ?? null);
  }, [slug]);

  const tournaments = useMemo(() => getTournamentsByGameSlug(slug), [slug]);
  const ranking = useMemo(() => getRankingByGameSlug(slug), [slug]);

  if (!hub) {
    return (
      <div className="page">
        <section className="page-hero">
          <span className="badge community">Modalidade não encontrada</span>
          <h1>Página de campeonato não localizada</h1>
          <p className="muted">
            Essa modalidade ainda não foi configurada no admin ou ainda não foi carregada neste navegador.
          </p>
          <div className="inline-actions">
            <Link href="/campeonatos" className="btn btn-primary">
              Voltar aos campeonatos
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="page-hero">
        <span className="badge official">{hub.name}</span>
        <h1>{hub.name}</h1>
        <p className="muted">{hub.shortDescription}</p>
        <div className="inline-actions">
          <Link href={`/criar-campeonato?game=${hub.slug}`} className="btn btn-primary">
            Criar campeonato
          </Link>
          <Link href="/campeonatos" className="btn btn-secondary">
            Voltar para a central
          </Link>
        </div>
      </section>

      <section className="card soft">
        <div className="section-head">
          <div>
            <h2 style={{ margin: 0 }}>Formato principal</h2>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              {hub.tournamentFormat}
            </p>
          </div>
        </div>
      </section>

      <div className="grid cols-2" style={{ marginTop: 24 }}>
        <section className="card soft">
          <div className="section-head">
            <div>
              <h2 style={{ margin: 0 }}>Campeonatos deste jogo</h2>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                Lista dos campeonatos já criados para {hub.name}.
              </p>
            </div>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            {tournaments.length > 0 ? (
              tournaments.map((tournament) => (
                <Link key={tournament.id} href={`/campeonatos/${tournament.id}`} className="list-row">
                  <div>
                    <strong>{tournament.name}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {tournament.platform} • {tournament.regionLabel}
                    </div>
                  </div>
                  <span className={`badge ${tournament.origin === "official" ? "official" : "community"}`}>
                    {tournament.origin === "official" ? "Oficial" : "Comunidade"}
                  </span>
                </Link>
              ))
            ) : (
              <div className="timer-banner">
                <strong style={{ color: "#92400e" }}>Nenhum campeonato criado</strong>
                <span className="muted">
                  Quando você abrir campeonatos para {hub.name}, eles passam a aparecer aqui.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="card soft">
          <div className="section-head">
            <div>
              <h2 style={{ margin: 0 }}>Ranking de {hub.name}</h2>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                Ranking exclusivo dos jogadores desta modalidade.
              </p>
            </div>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            {ranking.length > 0 ? (
              ranking.map((entry) => (
                <div key={entry.nick} className="list-row">
                  <div>
                    <strong>
                      #{entry.pos} {entry.nick}
                    </strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {entry.city} • {entry.uf}
                    </div>
                  </div>
                  <span className="badge official">{entry.pts} pts</span>
                </div>
              ))
            ) : (
              <div className="timer-banner">
                <strong style={{ color: "#92400e" }}>Ranking aguardando dados</strong>
                <span className="muted">
                  O ranking desta modalidade aparece quando os jogadores começarem a competir nela.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
