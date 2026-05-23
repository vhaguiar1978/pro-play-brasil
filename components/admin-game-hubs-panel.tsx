"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readManagedGameHubs,
  removeManagedGameHub,
  upsertManagedGameHub,
  type ManagedGameHub
} from "@/lib/managed-game-hubs";
import { GAMES } from "@/lib/games";

export function AdminGameHubsPanel() {
  const [hubs, setHubs] = useState<ManagedGameHub[]>([]);
  const [name, setName] = useState("");
  const [format, setFormat] = useState("Mata-mata");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setHubs(readManagedGameHubs());
  }, []);

  function refresh(message?: string) {
    setHubs(readManagedGameHubs());
    if (typeof message !== "undefined") {
      setFlash(message);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFlash("Informe o nome do jogo antes de salvar.");
      return;
    }

    upsertManagedGameHub({
      name,
      tournamentFormat: format
    });

    setName("");
    setFormat("Mata-mata");
    refresh("Modalidade salva. A página própria já fica disponível na central de campeonatos.");
  }

  function handleDelete(slug: string) {
    removeManagedGameHub(slug);
    refresh("Modalidade removida da lista personalizada.");
  }

  return (
    <section className="stack" style={{ marginTop: 24 }}>
      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Modalidades e páginas de campeonato</h2>
          <p className="muted">
            Aqui você cadastra o nome do jogo e o formato principal do campeonato. O sistema cria uma página própria
            para essa modalidade dentro da central de campeonatos.
          </p>
        </div>

        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>O que essa área libera</h2>
          <ul className="muted" style={{ paddingLeft: 20, margin: 0 }}>
            <li>Card da modalidade no rodapé da central de campeonatos</li>
            <li>Página própria por jogo</li>
            <li>Botão para criar campeonato daquela modalidade</li>
            <li>Lista dos campeonatos do jogo</li>
            <li>Ranking só daquele jogo</li>
          </ul>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Cadastrar modalidade</h2>
          <form className="stack" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="hub-name">Nome do jogo</label>
              <input
                id="hub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: FC 26 Pro Clubs"
              />
            </div>

            <div className="field">
              <label htmlFor="hub-format">Formato principal do campeonato</label>
              <input
                id="hub-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="Ex: Grupos + mata-mata"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Salvar modalidade
            </button>
            {flash ? <p className="muted">{flash}</p> : null}
          </form>
        </div>

        <div className="card soft">
          <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>Modalidades ativas</h2>
            <button type="button" className="btn btn-ghost" onClick={() => refresh()}>
              Atualizar
            </button>
          </div>

          <div className="stack" style={{ marginTop: 14 }}>
            {hubs.map((hub) => {
              const isDefault = GAMES.some((game) => game.slug === hub.slug);
              return (
                <div key={hub.slug} className="participant-card">
                  <div>
                    <strong>{hub.name}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {hub.tournamentFormat}
                    </div>
                    <div className="muted" style={{ fontSize: "0.82rem", marginTop: 6 }}>
                      /campeonatos/modalidades/{hub.slug}
                    </div>
                  </div>
                  <div className="inline-actions" style={{ marginTop: 0 }}>
                    <Link href={`/campeonatos/modalidades/${hub.slug}`} className="btn btn-secondary">
                      Abrir página
                    </Link>
                    {!isDefault ? (
                      <button type="button" className="btn btn-ghost" onClick={() => handleDelete(hub.slug)}>
                        Excluir
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
