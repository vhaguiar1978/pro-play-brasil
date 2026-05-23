"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { guardUserText } from "@/lib/content-guard";

type Props = { params: Promise<{ nickname: string }> };

type DM = { id: string; to: string; text: string; createdAt: string };

const KEY = "ppb_dm_v1";

function readAll(): DM[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DM[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: DM[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export default function MensagensPage({ params }: Props) {
  const { nickname } = use(params);
  const peer = decodeURIComponent(nickname);

  const [text, setText] = useState("");
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<DM[]>([]);

  useEffect(() => {
    const all = readAll();
    const msgs = all.filter((m) => m.to === peer).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (msgs.length > 0) {
      setThread(msgs);
      return;
    }
    const seeded: DM[] = [
      { id: "s1", to: peer, text: "Salve! Bora jogar mais tarde?", createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString() }
    ];
    writeAll([...seeded, ...all]);
    setThread(seeded);
  }, [peer, tick]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = guardUserText(text, { min: 1, max: 300, allowLinks: false });
    if (!res.ok) return setError(res.reason);
    const all = readAll();
    const next: DM = { id: crypto.randomUUID(), to: peer, text: res.cleaned, createdAt: new Date().toISOString() };
    writeAll([...all, next]);
    setText("");
    setTick((v) => v + 1);
  }

  return (
    <div className="stack">
      <section className="arena-topbar">
        <div>
          <h1>Mensagem</h1>
          <p>Conversa com <strong>{peer}</strong> (MVP local).</p>
        </div>
        <Link href="/amigos" className="btn btn-secondary">
          Voltar
        </Link>
      </section>

      <div className="card soft">
        <div className="stack">
          {thread.map((m) => (
            <div key={m.id} className="list-row">
              <div>
                <strong>Você</strong>
                <div className="muted" style={{ fontSize: "0.95rem" }}>{m.text}</div>
              </div>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                {new Date(m.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>

        <form className="inline-actions" style={{ marginTop: 14 }} onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva uma mensagem…"
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" type="submit">
            Enviar
          </button>
        </form>
        {error ? (
          <div className="timer-banner" style={{ marginTop: 12, borderColor: "rgba(255, 82, 82, 0.35)" }}>
            <strong style={{ color: "#b91c1c" }}>Mensagem bloqueada</strong>
            <span className="muted" style={{ color: "#b91c1c" }}>
              {error}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

