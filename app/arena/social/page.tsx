"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Friend = { nick: string; addedAt: string };

const KEY = "ppb_friends_v1";
const DEFAULT_FRIEND_NICKS = new Set(["brz_kaique"]);

function readAll(): Friend[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Friend[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Friend[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export default function SocialPage() {
  const [nick, setNick] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);

  function refreshFriends() {
    const base = readAll();
    const filtered = base.every((friend) => DEFAULT_FRIEND_NICKS.has(friend.nick.toLowerCase()))
      ? []
      : base.filter((friend) => !DEFAULT_FRIEND_NICKS.has(friend.nick.toLowerCase()));

    writeAll(filtered);
    setFriends(filtered);
  }

  useEffect(() => {
    refreshFriends();
  }, []);

  function addFriend(e: React.FormEvent) {
    e.preventDefault();
    const nextNick = nick.trim();
    if (!nextNick) return;
    const all = readAll();
    if (all.some((friend) => friend.nick.toLowerCase() === nextNick.toLowerCase())) return;
    writeAll([{ nick: nextNick, addedAt: new Date().toISOString() }, ...all]);
    setNick("");
    refreshFriends();
  }

  return (
    <div className="stack">
      <section className="arena-topbar">
        <div>
          <h1>Amigos</h1>
          <p>Lista de amigos e mensagens individuais dentro da plataforma.</p>
        </div>
      </section>

      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Adicionar amigo</h2>
          <form className="stack" onSubmit={addFriend}>
            <div className="field">
              <label htmlFor="friend">Nickname</label>
              <input
                id="friend"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Ex: vitor"
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Adicionar
            </button>
          </form>
        </div>

        <div className="card soft">
          <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>Seus amigos</h2>
            <button type="button" className="btn btn-ghost" onClick={refreshFriends}>
              Atualizar
            </button>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div key={friend.nick} className="list-row">
                  <div>
                    <strong>{friend.nick}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Adicionado em {new Date(friend.addedAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <Link className="btn btn-secondary" href={`/arena/mensagens/${encodeURIComponent(friend.nick)}`}>
                    Mensagem
                  </Link>
                </div>
              ))
            ) : (
              <div className="timer-banner">
                <strong style={{ color: "#92400e" }}>Nenhum amigo cadastrado</strong>
                <span className="muted">
                  A lista foi limpa. Adicione apenas os contatos que você realmente quiser manter na plataforma.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
