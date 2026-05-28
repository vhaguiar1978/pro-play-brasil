"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, Crown, PlayCircle, Radio, ShieldCheck, Tv2, Users } from "lucide-react";
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
const AGENDA_ROWS = [
  {
    time: "19:30",
    title: "Quartas da Arena",
    copy: "Check-in do time e confirmação de lobby antes da transmissão principal.",
    status: "Hoje"
  },
  {
    time: "21:00",
    title: "Semifinal ao vivo",
    copy: "Partida em destaque com CTA direto para assistir e acompanhar o ranking.",
    status: "Ao vivo"
  },
  {
    time: "23:59",
    title: "Fechamento da rodada",
    copy: "Janela final para enviar resultado e resolver contestação sem atrito.",
    status: "Pendente"
  }
] as const;

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
  if (list.every((post) => DEFAULT_STAFF_IDS.has(post.id))) return [];
  return list.filter((post) => !DEFAULT_STAFF_IDS.has(post.id));
}

function stripDefaultRecruitmentPosts(list: RecruitmentPost[]) {
  if (list.length === 0) return [];
  if (list.every((post) => DEFAULT_RECRUITMENT_IDS.has(post.id))) return [];
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 text-white md:px-6 md:py-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.18),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(53,194,255,0.12),_transparent_22%),linear-gradient(180deg,_#0b1018_0%,_#070b12_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              <Radio className="h-3 w-3" />
              Arena diária
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white md:text-5xl">
                Um hub vivo para acompanhar partidas, agenda e transmissão.
              </h1>
              <p className="max-w-2xl text-sm leading-8 text-white/70 md:text-base">
                A arena precisa fazer o usuário voltar. Aqui o foco é mostrar próximos passos, lives, alertas da
                organização e movimentação real da comunidade sem poluir a leitura.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ArenaStat label="Campeonatos" value={MOCK_TOURNAMENTS.length} />
              <ArenaStat label="Ao vivo" value={liveStreams.length} />
              <ArenaStat label="Anúncios" value={totalActiveAnnouncements} />
              <ArenaStat label="Destaque" value={featuredTournament ? "Ativo" : "Standby"} />
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Agenda da arena</div>
                <div className="mt-1 text-sm text-white/58">O que o jogador precisa ver hoje</div>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
                Hoje
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {AGENDA_ROWS.map((item, index) => (
                <div
                  key={item.title}
                  className={`grid gap-3 rounded-2xl border p-4 md:grid-cols-[88px,1fr,auto] ${
                    index === 0 ? "border-ppb-primary/35 bg-ppb-primary/10" : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="font-display text-2xl font-black uppercase text-ppb-primary">{item.time}</div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-wider text-white">{item.title}</div>
                    <p className="mt-1 text-sm leading-7 text-white/58">{item.copy}</p>
                  </div>
                  <div className="self-start rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.08fr,0.92fr]">
        <div className="grid gap-6">
          <section className="rounded-[1.8rem] border border-white/10 bg-[#0b1018] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">TV Pro Play</div>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">Transmissão oficial</h2>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  A TV principal da arena fica reservada para o canal oficial do Pro Play Brasil.
                </p>
              </div>
              <a
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 transition hover:border-ppb-primary/40 hover:text-white"
                href={OFFICIAL_CHANNEL_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Tv2 className="h-3.5 w-3.5 text-ppb-primary" />
                Abrir canal
              </a>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#06090f]">
              <div className="aspect-video bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.18),_transparent_20%),linear-gradient(180deg,_#101722_0%,_#05070c_100%)]">
                {tvEmbedUrl ? (
                  <iframe
                    src={tvEmbedUrl}
                    title="TV Pro Play"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="grid h-full place-items-center px-6 text-center">
                    <div className="grid gap-3">
                      <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/72">
                        TV oficial pronta
                      </span>
                      <strong className="font-display text-3xl font-black uppercase text-white">Arena Stage</strong>
                      <p className="mx-auto max-w-xl text-sm leading-8 text-white/62">
                        Quando a live oficial estiver pronta, ela entra aqui com embed do canal e vira o centro da
                        experiência interna.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form className="mt-4 grid gap-3 md:grid-cols-[1fr,auto,auto]" onSubmit={saveTv}>
              <input
                value={tvInput}
                onChange={(e) => setTvInput(e.target.value)}
                placeholder="Cole apenas o embed oficial do vídeo ou da live do canal"
                className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/30 focus:border-ppb-primary/50 focus:outline-none"
              />
              <button className="min-h-12 rounded-2xl bg-ppb-primary px-5 text-sm font-bold text-white shadow-ppb-glow" type="submit">
                Atualizar TV
              </button>
              {tvEmbedUrl ? (
                <button
                  className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white/72 transition hover:border-white/20 hover:text-white"
                  type="button"
                  onClick={clearTv}
                >
                  Limpar
                </button>
              ) : null}
            </form>
            {tvError ? <p className="mt-3 text-sm text-rose-300">{tvError}</p> : null}
          </section>

          <section className="rounded-[1.8rem] border border-white/10 bg-[#0b1018] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Mural da arena</div>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">Organização + comunidade</h2>
              </div>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 transition hover:border-ppb-primary/40 hover:text-white"
                href="/recrutamento"
              >
                <Users className="h-3.5 w-3.5 text-ppb-primary" />
                Recrutamento
              </Link>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <InfoColumn
                label="Organização"
                emptyTitle="Nenhum anúncio oficial no momento"
                emptyCopy="Quando a organização publicar um aviso real, ele aparece aqui logo abaixo da TV."
                items={staffPosts.map((post) => ({
                  title: post.author,
                  copy: post.text,
                  meta: new Date(post.createdAt).toLocaleString("pt-BR")
                }))}
              />
              <InfoColumn
                label="Comunidade"
                emptyTitle="Nenhuma postagem ativa"
                emptyCopy="Assim que alguém publicar procurando time ou parceiro, ela aparece aqui."
                items={recruitmentPosts.map((post) => ({
                  title: `${post.authorNick} • ${post.game}`,
                  copy: post.message,
                  meta: formatRecruitmentRemaining(post.expiresAt)
                }))}
              />
            </div>
          </section>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-[1.8rem] border border-white/10 bg-[#0b1018] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">Quem está ao vivo</div>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">Streams dos jogadores</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                {liveStreams.length} ativos
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {liveStreams.length > 0 ? (
                liveStreams.map((stream) => {
                  const context = getStreamContext(stream);
                  return (
                    <button
                      key={stream.nickname}
                      type="button"
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-ppb-primary/35 hover:bg-white/[0.06]"
                      onClick={() => handleOpenStream(stream)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_0_5px_rgba(239,68,68,0.12)]" />
                        <div>
                          <strong className="text-sm text-white">{stream.nickname}</strong>
                          <p className="mt-1 text-sm leading-7 text-white/58">{context.matchLabel}</p>
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/34">
                            {context.tournamentLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <strong className="text-sm text-white">{stream.viewersLabel}</strong>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">Abrir</div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyPanel
                  title="Ninguém streamando agora"
                  copy="Quando jogadores entrarem ao vivo, a lista vai aparecer aqui automaticamente."
                />
              )}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/10 bg-[#0b1018] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Mais clicados</div>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">Tendência da arena</h2>
              </div>
              <Bell className="h-4 w-4 text-ppb-primary" />
            </div>

            <div className="mt-4 grid gap-3">
              {topClickedStreams.length > 0 ? (
                topClickedStreams.map((stream, index) => (
                  <button
                    key={stream.nickname}
                    type="button"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-ppb-primary/35 hover:bg-white/[0.06]"
                    onClick={() => handleOpenStream(stream)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-2 text-xs font-black text-ppb-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <strong className="text-sm text-white">{stream.nickname}</strong>
                        <p className="mt-1 text-sm leading-7 text-white/58">{stream.streamTitle}</p>
                      </div>
                    </div>
                    <div className="text-sm font-black text-emerald-300">{stream.clicks} cliques</div>
                  </button>
                ))
              ) : (
                <EmptyPanel
                  title="Ainda sem ranking de cliques"
                  copy="Assim que os usuários abrirem as lives, os nomes mais acessados aparecem aqui."
                />
              )}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/10 bg-[#0b1018] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">Atalhos rápidos</div>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">Fluxo do dia</h2>
              </div>
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
            </div>

            <div className="mt-4 grid gap-3">
              {featuredTournament ? (
                <Link href={`/campeonatos/${featuredTournament.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-ppb-primary/35 hover:bg-white/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-sm text-white">{featuredTournament.name}</strong>
                      <p className="mt-1 text-sm leading-7 text-white/58">
                        {new Date(featuredTournament.startDate).toLocaleString("pt-BR")} • {featuredTournament.platform}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                      Ativo
                    </span>
                  </div>
                </Link>
              ) : null}
              <Link href="/campeonatos" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-ppb-primary/35 hover:bg-white/[0.06]">
                <strong className="text-sm text-white">Abrir campeonatos</strong>
                <p className="mt-1 text-sm leading-7 text-white/58">Inscrição, agenda, tabela e destaque visual de cada evento.</p>
              </Link>
              <Link href="/amigos" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-ppb-primary/35 hover:bg-white/[0.06]">
                <strong className="text-sm text-white">Amigos e mensagens</strong>
                <p className="mt-1 text-sm leading-7 text-white/58">Continue a conversa, convide parceiros e puxe o time para a arena.</p>
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ArenaStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">{label}</div>
      <div className="mt-2 font-display text-3xl font-black uppercase text-white">{value}</div>
    </div>
  );
}

function InfoColumn({
  label,
  emptyTitle,
  emptyCopy,
  items
}: {
  label: string;
  emptyTitle: string;
  emptyCopy: string;
  items: Array<{ title: string; copy: string; meta: string }>;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/44">{label}</div>
      <div className="mt-3 grid gap-3">
        {items.length > 0 ? (
          items.slice(0, 3).map((item) => (
            <div key={`${label}-${item.title}-${item.meta}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <strong className="text-sm text-white">{item.title}</strong>
              <p className="mt-2 text-sm leading-7 text-white/58">{item.copy}</p>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/34">{item.meta}</span>
            </div>
          ))
        ) : (
          <EmptyPanel title={emptyTitle} copy={emptyCopy} />
        )}
      </div>
    </div>
  );
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <strong className="text-sm text-white">{title}</strong>
      <p className="mt-2 text-sm leading-7 text-white/58">{copy}</p>
    </div>
  );
}
