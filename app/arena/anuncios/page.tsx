"use client";

import { useEffect, useState } from "react";
import { guardUserText } from "@/lib/content-guard";
import {
  formatRecruitmentRemaining,
  getRecruitmentExpiresAt,
  loadActiveRecruitmentPosts,
  RECRUITMENT_POST_TTL_DAYS,
  type RecruitmentPost,
  writeRecruitmentPosts
} from "@/lib/recruitment-storage";

const DEFAULT_RECRUITMENT_IDS = new Set(["a1", "a2"]);

export default function AnunciosPage() {
  const [authorNick, setAuthorNick] = useState("");
  const [game, setGame] = useState("");
  const [message, setMessage] = useState("");
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);

  useEffect(() => {
    const list = loadActiveRecruitmentPosts();
    const filtered = list.every((post) => DEFAULT_RECRUITMENT_IDS.has(post.id))
      ? []
      : list.filter((post) => !DEFAULT_RECRUITMENT_IDS.has(post.id));

    writeRecruitmentPosts(filtered);
    setPosts(filtered);
  }, [tick]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nickRes = guardUserText(authorNick, { min: 2, max: 24, allowLinks: false });
    if (!nickRes.ok) return setError(`Nickname: ${nickRes.reason}`);

    const gameRes = guardUserText(game, { min: 2, max: 32, allowLinks: false });
    if (!gameRes.ok) return setError(`Jogo: ${gameRes.reason}`);

    const msgRes = guardUserText(message, { min: 6, max: 400, allowLinks: false });
    if (!msgRes.ok) return setError(`Mensagem: ${msgRes.reason}`);

    const createdAt = new Date().toISOString();
    const next: RecruitmentPost = {
      id: crypto.randomUUID(),
      authorNick: nickRes.cleaned,
      game: gameRes.cleaned,
      message: msgRes.cleaned,
      createdAt,
      expiresAt: getRecruitmentExpiresAt(createdAt)
    };

    const all = loadActiveRecruitmentPosts().filter((post) => !DEFAULT_RECRUITMENT_IDS.has(post.id));
    writeRecruitmentPosts([next, ...all]);
    setAuthorNick("");
    setGame("");
    setMessage("");
    setTick((value) => value + 1);
  }

  return (
    <div className="stack">
      <section className="arena-topbar">
        <div>
          <h1>Postagens</h1>
          <p>Área para publicar procura de time, parceiro, duo ou elenco para campeonatos.</p>
        </div>
      </section>

      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Criar postagem</h2>
          <form className="stack" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="nick">Seu nickname</label>
              <input id="nick" value={authorNick} onChange={(e) => setAuthorNick(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="game">Jogo</label>
              <input id="game" value={game} onChange={(e) => setGame(e.target.value)} placeholder="Ex: FC 26" />
            </div>

            <div className="field">
              <label htmlFor="msg">Mensagem</label>
              <textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: procurando time para campeonato, parceiro de treino, horários e plataforma..."
              />
            </div>

            <button className="btn btn-primary" type="submit">
              Publicar
            </button>
            {error ? (
              <div className="timer-banner" style={{ borderColor: "rgba(255, 82, 82, 0.35)" }}>
                <strong style={{ color: "#b91c1c" }}>Não foi possível publicar</strong>
                <span className="muted" style={{ color: "#b91c1c" }}>
                  {error}
                </span>
              </div>
            ) : null}
            <p className="muted">
              Cada postagem fica ativa por {RECRUITMENT_POST_TTL_DAYS} dias e depois sai do mural automaticamente.
            </p>
          </form>
        </div>

        <div className="card soft">
          <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>Postagens da comunidade</h2>
            <button type="button" className="btn btn-ghost" onClick={() => setTick((value) => value + 1)}>
              Atualizar
            </button>
          </div>

          <div className="stack" style={{ marginTop: 12 }}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="list-row">
                  <div>
                    <strong>
                      {post.authorNick} • {post.game}
                    </strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {post.message}
                    </div>
                    <div className="muted" style={{ fontSize: "0.82rem", marginTop: 6 }}>
                      {formatRecruitmentRemaining(post.expiresAt)}
                    </div>
                  </div>
                  <span className="badge community">Postagem</span>
                </div>
              ))
            ) : (
              <div className="timer-banner">
                <strong style={{ color: "#92400e" }}>Nenhuma postagem ativa</strong>
                <span className="muted">
                  O mural foi limpo. As novas publicações da comunidade vão aparecer aqui conforme forem criadas.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
