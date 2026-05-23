"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllParticipantStreams, getLiveParticipantStreams, type ParticipantStream } from "@/lib/mock-streams";
import { MOCK_MATCHES } from "@/lib/mock-matches";
import { getTournamentById, MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";
import { formatRecruitmentRemaining, loadActiveRecruitmentPosts, type RecruitmentPost } from "@/lib/recruitment-storage";
import { rankStreamsByClicks, readStreamClickMap, registerStreamClick, type StreamClickMap } from "@/lib/stream-clicks";

type StaffPost = { id: string; author: string; text: string; createdAt: string };

const STAFF_KEY = "ppb_staff_mural_v1";
const TV_KEY = "ppb_tv_url_v1";
const OFFICIAL_CHANNEL_URL = "https://www.youtube.com/@ProPlayBrasil";
const DEFAULT_STAFF_IDS = new Set(["p1", "p2", "p3"]);
const DEFAULT_RECRUITMENT_IDS = new Set(["a1", "a2"]);

function readStaff(): StaffPost[] {
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StaffPost[]) : [];
  } catch {
    return [];
  }
}

function writeStaff(list: StaffPost[]) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(list));
}

function readTv(): string {
  try {
    const saved = localStorage.getItem(TV_KEY);
    return saved && saved.trim().length > 0 ? saved : "";
  } catch {
    return "";
  }
}

function normalizeOfficialYouTubeEmbed(input: string) {
  const value = input.trim();
  if (!value) return "";
  return value.includes("youtube.com/embed/") || value.includes("youtube-nocookie.com/embed/") ? value : "";
}

function stripDefaultStaffPosts(list: StaffPost[]) {
  if (list.length === 0) return [];
  if (list.every((post) => DEFAULT_STAFF_IDS.has(post.id))) {
    return [];
  }

  return list.filter((post) => !DEFAULT_STAFF_IDS.has(post.id));
}

function stripDefaultRecruitmentPosts(list: RecruitmentPost[]) {
  if (list.length === 0) return [];
  if (list.every((post) => DEFAULT_RECRUITMENT_IDS.has(post.id))) {
    return [];
  }

  return list.filter((post) => !DEFAULT_RECRUITMENT_IDS.has(post.id));
}

function getStreamContext(stream: ParticipantStream) {
  const liveMatch = MOCK_MATCHES.find(
    (match) =>
      match.status === "em_andamento" &&
      (match.playerA.nickname === stream.nickname || match.playerB.nickname === stream.nickname)
  );

  if (!liveMatch) {
    return {
      matchLabel: stream.streamTitle,
      tournamentLabel: "Live da comunidade"
    };
  }

  const tournament = getTournamentById(liveMatch.tournamentId);
  return {
    matchLabel: `${liveMatch.roundLabel} • ${liveMatch.playerA.nickname} vs ${liveMatch.playerB.nickname}`,
    tournamentLabel: tournament?.name ?? "Campeonato Pro Play"
  };
}

export default function ArenaHubPage() {
  const [tick, setTick] = useState(0);
  const [tvInput, setTvInput] = useState("");
  const [tvEmbedUrl, setTvEmbedUrl] = useState("");
  const [staffPosts, setStaffPosts] = useState<StaffPost[]>([]);
  const [recruitmentPosts, setRecruitmentPosts] = useState<RecruitmentPost[]>([]);
  const [clickMap, setClickMap] = useState<StreamClickMap>({});
  const [tvError, setTvError] = useState<string | null>(null);

  useEffect(() => {
    const filteredStaff = stripDefaultStaffPosts(readStaff());
    writeStaff(filteredStaff);
    setStaffPosts(filteredStaff);

    const filteredRecruitment = stripDefaultRecruitmentPosts(loadActiveRecruitmentPosts());
    setRecruitmentPosts(filteredRecruitment);

    setTvEmbedUrl(readTv());
    setClickMap(readStreamClickMap());
  }, [tick]);

  const liveStreams = getLiveParticipantStreams();
  const allStreams = getAllParticipantStreams();
  const rankedStreams = rankStreamsByClicks(allStreams, clickMap);
  const topClickedStreams = rankedStreams.filter((stream) => stream.clicks > 0).slice(0, 4);
  const totalActiveAnnouncements = staffPosts.length + recruitmentPosts.length;
  const featuredTournament = MOCK_TOURNAMENTS[0];

  function saveTv(e: React.FormEvent) {
    e.preventDefault();
    setTvError(null);

    const next = normalizeOfficialYouTubeEmbed(tvInput);
    if (!next) {
      setTvError("Use apenas o link de embed oficial do vídeo ou da live do canal Pro Play Brasil.");
      return;
    }

    localStorage.setItem(TV_KEY, next);
    setTvInput("");
    setTick((value) => value + 1);
  }

  function clearTv() {
    localStorage.removeItem(TV_KEY);
    setTick((value) => value + 1);
  }

  function handleOpenStream(stream: ParticipantStream) {
    const nextMap = registerStreamClick(stream.nickname);
    setClickMap(nextMap);
    window.open(stream.twitchUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="dashboard-shell">
      <section className="arena-topbar">
        <div>
          <h1>Dashboard Pro Play</h1>
          <p>TV oficial, atalhos rápidos e espaços limpos para você publicar só o que realmente estiver valendo.</p>
        </div>
        <div className="inline-actions">
          <Link className="btn btn-ghost" href="/campeonatos">
            Campeonatos
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => setTick((value) => value + 1)}>
            Atualizar
          </button>
        </div>
      </section>

      <section className="dashboard-hero-card">
        <div className="dashboard-hero-layer" />
        <div className="dashboard-hero-copy">
          <span className="badge official">Arena limpa</span>
          <h2>Uma arena pronta para receber eventos reais, sem os campeonatos antigos da demonstração.</h2>
          <p>
            Agora o hub abre zerado para você publicar apenas a agenda oficial, os anúncios reais da organização e as
            lives que realmente estiverem acontecendo.
          </p>
          <div className="dashboard-kpis">
            <div className="dashboard-kpi-card">
              <strong>{MOCK_TOURNAMENTS.length}</strong>
              <span>campeonatos no ar</span>
            </div>
            <div className="dashboard-kpi-card">
              <strong>{liveStreams.length}</strong>
              <span>streamers ao vivo</span>
            </div>
            <div className="dashboard-kpi-card">
              <strong>{totalActiveAnnouncements}</strong>
              <span>anúncios ativos</span>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main-column">
          <section className="card soft dashboard-tv-card">
            <div className="dashboard-section-head">
              <div className="kpi">
                <strong>TV Pro Play</strong>
                <span>TV oficial do canal Pro Play Brasil para vídeos e lives próprias</span>
              </div>
              <div className="pill-row">
                <span className="pill active">Canal oficial</span>
                <span className="pill">YouTube Pro Play Brasil</span>
                <span className="pill">Live oficial</span>
              </div>
            </div>

            <div className="dashboard-tv-frame">
              {tvEmbedUrl ? (
                <iframe
                  src={tvEmbedUrl}
                  title="TV Pro Play"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="dashboard-tv-placeholder">
                  <div>
                    <span className="badge">TV oficial pronta</span>
                    <h3>A TV central fica reservada para o canal do Pro Play Brasil</h3>
                    <p>
                      Aqui entram somente os vídeos oficiais e a live oficial do canal. Quando você tiver a transmissão
                      no ar, basta usar o embed da live do próprio canal para atualizar a TV central.
                    </p>
                    <div className="inline-actions" style={{ justifyContent: "center" }}>
                      <a className="btn btn-secondary" href={OFFICIAL_CHANNEL_URL} target="_blank" rel="noreferrer">
                        Abrir canal oficial
                      </a>
                      <Link className="btn btn-ghost" href="/campeonatos">
                        Ver campeonatos
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="dashboard-tv-controls" onSubmit={saveTv}>
              <input
                value={tvInput}
                onChange={(e) => setTvInput(e.target.value)}
                placeholder="Cole apenas o embed oficial do vídeo ou da live do canal"
              />
              <button className="btn btn-primary" type="submit">
                Atualizar TV oficial
              </button>
              {tvEmbedUrl ? (
                <button className="btn btn-ghost" type="button" onClick={clearTv}>
                  Limpar TV
                </button>
              ) : null}
            </form>
            {tvError ? (
              <p className="muted" role="status" style={{ color: "#b91c1c", margin: 0 }}>
                {tvError}
              </p>
            ) : null}
            <p className="muted" style={{ margin: 0 }}>
              Essa tela agora está pensada para exibir somente conteúdo oficial do canal Pro Play Brasil no YouTube.
            </p>
          </section>

          <section className="card soft">
            <div className="dashboard-section-head">
              <div className="kpi">
                <strong>Painel de anúncios</strong>
                <span>Avisos oficiais e movimentação da comunidade logo abaixo da TV</span>
              </div>
              <Link className="btn btn-ghost" href="/recrutamento">
                Abrir recrutamento
              </Link>
            </div>

            <div className="dashboard-announcement-grid">
              <div className="dashboard-panel-block">
                <div className="dashboard-panel-title">Organização</div>
                <div className="stack">
                  {staffPosts.length > 0 ? (
                    staffPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="dashboard-news-card">
                        <strong>{post.author}</strong>
                        <p>{post.text}</p>
                        <span>{new Date(post.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-empty-state">
                      <strong>Nenhum anúncio oficial no momento</strong>
                      <p>Quando a organização publicar um aviso real, ele aparece aqui abaixo da TV.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-panel-block">
                <div className="dashboard-panel-title">Comunidade</div>
                <div className="stack">
                  {recruitmentPosts.length > 0 ? (
                    recruitmentPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="dashboard-news-card">
                        <strong>
                          {post.authorNick} • {post.game}
                        </strong>
                        <p>{post.message}</p>
                        <span>{formatRecruitmentRemaining(post.expiresAt)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-empty-state">
                      <strong>Nenhuma postagem ativa</strong>
                      <p>Assim que alguém publicar procurando time ou parceiro, ela aparece aqui.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <section className="card soft">
            <div className="dashboard-section-head">
              <div className="kpi">
                <strong>Quem está streamando</strong>
                <span>Lista pronta para abrir a live do participante assim que ele estiver ao vivo</span>
              </div>
            </div>

            <div className="stack">
              {liveStreams.length > 0 ? (
                liveStreams.map((stream) => {
                  const context = getStreamContext(stream);
                  return (
                    <button
                      key={stream.nickname}
                      type="button"
                      className="dashboard-stream-row"
                      onClick={() => handleOpenStream(stream)}
                    >
                      <div className="dashboard-stream-main">
                        <span className="dashboard-live-dot" aria-hidden />
                        <div>
                          <strong>{stream.nickname}</strong>
                          <p>{context.matchLabel}</p>
                          <span>
                            {context.tournamentLabel} • {stream.gameLabel}
                          </span>
                        </div>
                      </div>
                      <div className="dashboard-stream-meta">
                        <strong>{stream.viewersLabel}</strong>
                        <span>Abrir live</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="dashboard-empty-state">
                  <strong>Ninguém streamando agora</strong>
                  <p>Quando jogadores entrarem ao vivo, a lista vai aparecer aqui automaticamente.</p>
                </div>
              )}
            </div>
          </section>

          <section className="card soft">
            <div className="dashboard-section-head">
              <div className="kpi">
                <strong>Mais clicados</strong>
                <span>Os nomes que mais receberam cliques para abrir a live</span>
              </div>
            </div>

            <div className="stack">
              {topClickedStreams.length > 0 ? (
                topClickedStreams.map((stream, index) => (
                  <button
                    key={stream.nickname}
                    type="button"
                    className="dashboard-click-row"
                    onClick={() => handleOpenStream(stream)}
                  >
                    <span className="dashboard-rank-pill">#{index + 1}</span>
                    <div className="dashboard-click-copy">
                      <strong>{stream.nickname}</strong>
                      <p>{stream.streamTitle}</p>
                    </div>
                    <span className="dashboard-click-count">{stream.clicks} cliques</span>
                  </button>
                ))
              ) : (
                <div className="dashboard-empty-state">
                  <strong>Ainda sem ranking de cliques</strong>
                  <p>Assim que os usuários abrirem as lives, os nomes mais acessados vão aparecer aqui.</p>
                </div>
              )}
            </div>
          </section>

          <section className="card soft">
            <div className="dashboard-section-head">
              <div className="kpi">
                <strong>Destaques rápidos</strong>
                <span>Atalhos para os pontos principais do produto</span>
              </div>
            </div>

            <div className="stack">
              {featuredTournament ? (
                <Link className="list-row" href={`/campeonatos/${featuredTournament.id}`}>
                  <div>
                    <strong>{featuredTournament.name}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {new Date(featuredTournament.startDate).toLocaleString("pt-BR")} • {featuredTournament.platform}
                    </div>
                  </div>
                  <span className="badge official">Ativo</span>
                </Link>
              ) : (
                <div className="dashboard-empty-state">
                  <strong>Nenhum campeonato ativo</strong>
                  <p>Quando o próximo evento for aberto, ele aparece aqui como destaque rápido.</p>
                </div>
              )}
              <Link className="list-row" href="/apostas">
                <div>
                  <strong>Apostas em PPC</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Área pronta para receber os próximos mercados liberados
                  </div>
                </div>
                <span className="badge community">Entrar</span>
              </Link>
              <Link className="list-row" href="/amigos">
                <div>
                  <strong>Amigos e mensagens</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Continue a conversa e convide parceiros
                  </div>
                </div>
                <span className="badge">Social</span>
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
