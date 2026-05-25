"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { readArenaProfile } from "@/lib/profile-storage";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = { params: Promise<{ id: string }> };

type MatchPlayer = { nickname: string; teamName?: string; whatsapp?: string };
type MatchStatus = "tbd" | "pending" | "result_submitted" | "disputed" | "finalized" | "bye";

type Match = {
  id: string;
  tournamentId: string;
  round: number;
  roundLabel: string;
  playerA: MatchPlayer | null;
  playerB: MatchPlayer | null;
  status: MatchStatus;
  submittedScoreA: number | null;
  submittedScoreB: number | null;
  submittedBy: "A" | "B" | "admin" | null;
  submittedAt: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: "A" | "B" | null;
  disputeReason: string | null;
  scheduledAt: string | null;
  proofUrlSubmitted: string | null;
  proofUrlDisputed: string | null;
  autoConfirmAt: string | null;
};

export default function PartidaPage({ params }: Props) {
  const { id } = use(params);
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [myNickname, setMyNickname] = useState<string>("");
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [showDispute, setShowDispute] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  const fetchMatch = useCallback(async () => {
    try {
      const tournamentId = id.split("__")[0];
      const r = await fetch(`/api/tournaments/${tournamentId}/matches`);
      const data = await r.json();
      const found = (data.matches ?? []).find((m: Match) => m.id === id);
      setMatch(found ?? null);
    } catch {
      setMatch(null);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
    const p = readArenaProfile();
    setMyNickname(p?.gamertag ?? "");
  }, [fetchMatch]);

  useEffect(() => {
    if (match?.submittedScoreA != null) setScoreA(String(match.submittedScoreA));
    if (match?.submittedScoreB != null) setScoreB(String(match.submittedScoreB));
  }, [match?.submittedScoreA, match?.submittedScoreB]);

  // Countdown pra auto-confirmação
  useEffect(() => {
    if (!match?.autoConfirmAt || match.status !== "result_submitted") {
      setCountdown("");
      return;
    }
    const target = new Date(match.autoConfirmAt).getTime();
    const tick = () => {
      const remainMs = target - Date.now();
      if (remainMs <= 0) {
        setCountdown("Auto-confirmando...");
        fetchMatch();
        return;
      }
      const mins = Math.floor(remainMs / 60000);
      const secs = Math.floor((remainMs % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const intId = setInterval(tick, 1000);
    return () => clearInterval(intId);
  }, [match?.autoConfirmAt, match?.status, fetchMatch]);

  function handleProofPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
    e.target.value = "";
  }

  async function uploadProofIfAny(): Promise<string | null> {
    if (!proofFile || !match) return null;
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", proofFile);
      const r = await fetch(`/api/matches/${match.id}/proof`, { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload do print falhou");
      return data.url as string;
    } finally {
      setUploadingProof(false);
    }
  }

  if (match === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ppb-primary" />
      </div>
    );
  }
  if (match === null) notFound();

  const iAmA = match.playerA?.nickname.toLowerCase() === myNickname.toLowerCase();
  const iAmB = match.playerB?.nickname.toLowerCase() === myNickname.toLowerCase();
  const iAmPlayer = iAmA || iAmB;
  const mySlot: "A" | "B" | null = iAmA ? "A" : iAmB ? "B" : null;

  const canSubmit = (match.status === "pending" || match.status === "result_submitted") && iAmPlayer;
  const canConfirm =
    match.status === "result_submitted" && iAmPlayer && match.submittedBy !== mySlot;
  const canDispute = canConfirm;

  async function action(url: string, body?: unknown, successMsg = "Atualizado"): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      setFlash(successMsg);
      setTimeout(() => setFlash(null), 2500);
      await fetchMatch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function submitResult() {
    if (!mySlot) return;
    try {
      const proofUrl = await uploadProofIfAny();
      await action(
        `/api/matches/${match!.id}/submit-result`,
        { by: mySlot, scoreA: Number(scoreA), scoreB: Number(scoreB), proofUrl },
        "Resultado enviado — aguardando confirmação do adversário"
      );
      setProofFile(null);
      setProofPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  function confirmResult() {
    action(
      `/api/matches/${match!.id}/confirm`,
      undefined,
      "Resultado confirmado! Vencedor avançou no chaveamento."
    );
  }

  async function submitDispute() {
    try {
      const proofUrl = await uploadProofIfAny();
      await action(
        `/api/matches/${match!.id}/dispute`,
        { reason: disputeReason, proofUrl },
        "Disputa registrada — admin vai revisar"
      );
      setShowDispute(false);
      setProofFile(null);
      setProofPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  function whatsappForOpponent(): string | null {
    if (!match || !mySlot) return null;
    const opponent = mySlot === "A" ? match.playerB : match.playerA;
    if (!opponent?.whatsapp) return null;
    const me = mySlot === "A" ? match.playerA : match.playerB;
    const myScore = mySlot === "A" ? match.submittedScoreA : match.submittedScoreB;
    const opScore = mySlot === "A" ? match.submittedScoreB : match.submittedScoreA;
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://proplaybrasil.com.br/partidas/${match.id}`;
    const msg = `Salve ${opponent.nickname}! Aqui é ${
      me?.nickname ?? myNickname
    }, da partida ${match.roundLabel} do campeonato. ${
      match.status === "result_submitted"
        ? `Lancei o placar ${match.submittedScoreA ?? myScore} x ${match.submittedScoreB ?? opScore} pra confirmação.`
        : "Bora marcar a partida?"
    }\n\nLink: ${url}`;
    return buildWhatsAppUrl(opponent.whatsapp, msg);
  }

  const statusTone: StatusTone =
    match.status === "finalized" || match.status === "bye"
      ? "finished"
      : match.status === "pending"
        ? "open"
        : match.status === "result_submitted"
          ? "soon"
          : "live";
  const statusLabel =
    match.status === "pending"
      ? "Pronta pra jogar"
      : match.status === "result_submitted"
        ? "Aguardando confirmação"
        : match.status === "disputed"
          ? "Em disputa"
          : match.status === "finalized"
            ? "Finalizada"
            : match.status === "bye"
              ? "BYE — vaga automática"
              : "A definir";

  return (
    <div className="flex flex-col gap-8 pb-20 md:pb-24">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/15 via-ppb-background to-ppb-background" />
        <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/25 blur-[140px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-accent/15 blur-[140px]" />

        <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-8 md:px-6 md:pb-12 md:pt-12">
          <Link
            href={`/campeonatos/${match.tournamentId}`}
            className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-xs font-semibold text-ppb-muted backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao campeonato
          </Link>

          <div className="mt-8 flex flex-col items-start gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted backdrop-blur">
                <Trophy className="h-3 w-3 text-ppb-primary" />
                {match.roundLabel}
              </span>
              {iAmPlayer ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ppb-accent/40 bg-ppb-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-accent backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  Você está nessa partida
                </span>
              ) : null}
            </div>

            <h1 className="font-display text-3xl font-black uppercase leading-[0.9] tracking-[-0.02em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-4xl md:text-5xl">
              {match.playerA?.nickname ?? "A definir"} <span className="text-ppb-mutedSoft">vs</span>{" "}
              {match.playerB?.nickname ?? "A definir"}
            </h1>
          </div>
        </div>
      </section>

      {/* PLACAR + AÇÕES */}
      <section className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
            <PlayerBlock
              player={match.playerA}
              isWinner={match.winner === "A"}
              isYou={iAmA}
              isFinalized={match.status === "finalized" || match.status === "bye"}
            />
            <div className="flex flex-col items-center gap-2">
              <Swords className="h-6 w-6 text-ppb-mutedSoft" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">vs</span>
            </div>
            <PlayerBlock
              player={match.playerB}
              isWinner={match.winner === "B"}
              isYou={iAmB}
              isFinalized={match.status === "finalized" || match.status === "bye"}
            />
          </div>

          {/* PLACAR OFICIAL */}
          {match.status === "finalized" || match.status === "bye" ? (
            <div className="mt-6 rounded-2xl border border-ppb-gold/30 bg-gradient-to-r from-ppb-gold/10 via-transparent to-ppb-gold/10 p-5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-gold">
                <Crown className="mr-1 inline h-3 w-3" />
                Resultado oficial
              </div>
              <div className="mt-2 font-display text-5xl font-black text-white">
                {match.scoreA ?? 0} <span className="text-ppb-mutedSoft">x</span> {match.scoreB ?? 0}
              </div>
              {match.proofUrlSubmitted ? (
                <a
                  href={match.proofUrlSubmitted}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ppb-gold/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-gold ring-1 ring-ppb-gold/40 hover:bg-ppb-gold/30"
                >
                  <ImageIcon className="h-3 w-3" />
                  Print da partida
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : null}
            </div>
          ) : null}

          {/* PLACAR PROVISÓRIO */}
          {match.status === "result_submitted" ? (
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                <span className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Aguardando confirmação · Enviado por{" "}
                  {match.submittedBy === "A" ? match.playerA?.nickname : match.playerB?.nickname}
                </span>
                {countdown ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-500/40">
                    Auto-confirm em {countdown}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-center font-display text-4xl font-black text-white">
                {match.submittedScoreA} <span className="text-ppb-mutedSoft">x</span> {match.submittedScoreB}
              </div>
              {match.proofUrlSubmitted ? (
                <a
                  href={match.proofUrlSubmitted}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                >
                  <ImageIcon className="h-3 w-3" />
                  Ver print enviado
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : null}
            </div>
          ) : null}

          {/* DISPUTA */}
          {match.status === "disputed" ? (
            <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-300" />
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                    Em revisão pela administração
                  </div>
                  {match.disputeReason ? (
                    <p className="mt-1 text-sm text-ppb-text/90">&ldquo;{match.disputeReason}&rdquo;</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {match.proofUrlSubmitted ? (
                      <a
                        href={match.proofUrlSubmitted}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Print do envio
                      </a>
                    ) : null}
                    {match.proofUrlDisputed ? (
                      <a
                        href={match.proofUrlDisputed}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200 ring-1 ring-rose-500/40 hover:bg-rose-500/30"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Print da contestação
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* AÇÕES DO JOGADOR */}
          {iAmPlayer && match.status !== "finalized" && match.status !== "bye" && match.status !== "tbd" ? (
            <div className="mt-6 space-y-4">
              {/* Envio de resultado */}
              {canSubmit ? (
                <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
                    <Sparkles className="h-3 w-3" />
                    Enviar resultado
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <input
                      type="number"
                      min={0}
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      placeholder="0"
                      className="w-20 rounded-xl border border-ppb-border bg-ppb-surface px-3 py-3 text-center font-display text-2xl font-black text-white focus:border-ppb-primary focus:outline-none"
                    />
                    <span className="font-display text-2xl text-ppb-muted">x</span>
                    <input
                      type="number"
                      min={0}
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      placeholder="0"
                      className="w-20 rounded-xl border border-ppb-border bg-ppb-surface px-3 py-3 text-center font-display text-2xl font-black text-white focus:border-ppb-primary focus:outline-none"
                    />
                  </div>

                  <ProofPicker
                    proofPreview={proofPreview}
                    onPick={handleProofPick}
                    onClear={() => {
                      setProofFile(null);
                      setProofPreview(null);
                    }}
                  />

                  <button
                    type="button"
                    onClick={submitResult}
                    disabled={loading || uploadingProof || scoreA === "" || scoreB === "" || scoreA === scoreB}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:cursor-wait disabled:opacity-50"
                  >
                    {loading || uploadingProof ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {uploadingProof
                      ? "Enviando print..."
                      : match.status === "result_submitted"
                        ? "Corrigir placar"
                        : "Enviar placar"}
                  </button>
                  {scoreA === scoreB && scoreA !== "" ? (
                    <p className="mt-2 text-[10px] text-amber-300">Empate não decide — defina um vencedor.</p>
                  ) : null}
                </div>
              ) : null}

              {/* AVISAR ADVERSÁRIO NO WHATSAPP — só pra quem enviou */}
              {mySlot && match.status === "result_submitted" && match.submittedBy === mySlot ? (
                <WhatsAppNudge href={whatsappForOpponent()} />
              ) : null}

              {/* Confirmar / Contestar */}
              {canConfirm ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={confirmResult}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirmar resultado
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDispute((v) => !v)}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-3 text-sm font-bold uppercase tracking-wider text-ppb-text transition hover:border-rose-500/40 hover:text-rose-300"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Contestar
                  </button>
                </div>
              ) : null}

              {/* Form de dispute */}
              {showDispute && canDispute ? (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                    Motivo da contestação
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Explica o que aconteceu..."
                    className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-surface px-3 py-2 text-sm text-ppb-text focus:border-rose-500 focus:outline-none"
                  />
                  <ProofPicker
                    proofPreview={proofPreview}
                    onPick={handleProofPick}
                    onClear={() => {
                      setProofFile(null);
                      setProofPreview(null);
                    }}
                    hint="Anexe um print que prove sua versão"
                  />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDispute(false)}
                      className="rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2 text-xs font-bold uppercase tracking-wider text-ppb-muted hover:border-ppb-borderStrong hover:text-ppb-text"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={submitDispute}
                      disabled={!disputeReason.trim() || loading || uploadingProof}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_16px_rgba(244,63,94,0.35)] hover:bg-rose-400 disabled:opacity-50"
                    >
                      {loading || uploadingProof ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Enviar contestação
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* AVISO QUEM NÃO É JOGADOR */}
          {!iAmPlayer && match.status !== "finalized" && match.status !== "bye" && match.status !== "tbd" ? (
            <div className="mt-6 rounded-2xl border border-ppb-border bg-ppb-subtle/40 p-4 text-center">
              <p className="text-xs text-ppb-muted">
                Só os jogadores dessa partida podem enviar/confirmar resultado.
                {myNickname ? (
                  ""
                ) : (
                  <>
                    {" "}
                    <Link href="/perfil/editar" className="font-bold text-ppb-primary hover:underline">
                      Defina seu gamertag
                    </Link>{" "}
                    pra participar.
                  </>
                )}
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          ) : null}
          {flash ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {flash}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={fetchMatch}
            className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
          >
            <RefreshCw className="h-3 w-3" />
            Atualizar
          </button>
        </div>
      </section>
    </div>
  );
}

function ProofPicker({
  proofPreview,
  onPick,
  onClear,
  hint
}: {
  proofPreview: string | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  hint?: string;
}) {
  return (
    <div className="mt-3">
      {proofPreview ? (
        <div className="relative overflow-hidden rounded-xl border border-ppb-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofPreview}
            alt="Preview do print"
            className="max-h-48 w-full bg-ppb-background object-contain"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ppb-background/80 text-white hover:bg-ppb-background"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ppb-border bg-ppb-subtle/40 px-3 py-3 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text">
          <Paperclip className="h-3.5 w-3.5" />
          {hint ?? "Anexar print (opcional)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPick}
          />
        </label>
      )}
    </div>
  );
}

function WhatsAppNudge({ href }: { href: string | null }) {
  if (!href) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-ppb-border bg-ppb-subtle/40 px-3 py-2.5 text-xs text-ppb-muted">
        <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Adversário sem WhatsApp cadastrado. Avisa por outro canal pra ele confirmar o resultado.
        </span>
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400"
    >
      <MessageCircle className="h-4 w-4" />
      Avisar adversário no WhatsApp
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function PlayerBlock({
  player,
  isWinner,
  isYou,
  isFinalized
}: {
  player: MatchPlayer | null;
  isWinner: boolean;
  isYou: boolean;
  isFinalized: boolean;
}) {
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ppb-border bg-ppb-subtle/40 p-4 text-center">
        <Clock className="h-8 w-8 text-ppb-mutedSoft" />
        <span className="text-xs font-bold uppercase tracking-wider text-ppb-mutedSoft">A definir</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all",
        isWinner && isFinalized
          ? "border-ppb-gold/50 bg-ppb-gold/10 shadow-[0_0_24px_rgba(243,178,79,0.25)]"
          : "border-ppb-border bg-ppb-subtle/40",
        isYou && "ring-2 ring-ppb-accent/40"
      )}
    >
      <PlayerAvatar nick={player.nickname} size="lg" />
      <div>
        <div className="font-display text-base font-black uppercase text-ppb-text">
          {player.teamName || player.nickname}
        </div>
        {player.teamName ? (
          <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
            {player.nickname}
          </div>
        ) : null}
      </div>
      {isYou ? (
        <span className="rounded-full bg-ppb-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-accent ring-1 ring-ppb-accent/40">
          Você
        </span>
      ) : null}
      {isWinner && isFinalized ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-ppb-gold px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-ppb-background">
          <Crown className="h-2.5 w-2.5" />
          Venceu
        </span>
      ) : null}
    </div>
  );
}
