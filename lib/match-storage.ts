import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";
import { grantBadge } from "@/lib/player-badges-storage";
import { createNotification } from "@/lib/notifications-storage";
import { computeGroupStandings } from "@/lib/group-standings";

async function notifySafe(...args: Parameters<typeof createNotification>) {
  try {
    await createNotification(...args);
  } catch (err) {
    console.warn("[match-storage] notify falhou:", err);
  }
}

// Storage de matches (partidas) com avanço automático no chaveamento.
// Backend automático: filesystem (dev) → Supabase em prod.
// SQL: ver docs/SUPABASE_MIGRATION.md (table: matches).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "matches.json");
const TABLE = "matches";

export type MatchStatus =
  | "tbd" // A definir (aguardando rodada anterior)
  | "pending" // Pronta pra jogar, aguardando resultado
  | "result_submitted" // Alguém enviou, aguardando confirmação
  | "disputed" // Disputa em aberto, admin precisa decidir
  | "finalized" // Resultado oficial, vencedor decidido
  | "bye"; // Vaga automática (sem oponente)

export type MatchPlayer = {
  nickname: string;
  teamName?: string;
  /** WhatsApp pra notificações (opcional). Vem do registro de inscrição. */
  whatsapp?: string;
};

/** Auto-confirmação acontece se passar isso sem o adversário responder. */
const AUTO_CONFIRM_MINUTES = 10;
export type MatchSlot = "A" | "B";

export type Match = {
  id: string;
  tournamentId: string;
  round: number; // 1 = primeira rodada, 2 = quartas, etc.
  matchNumber: number; // posição dentro da rodada (0-indexed)
  roundLabel: string;
  playerA: MatchPlayer | null;
  playerB: MatchPlayer | null;
  status: MatchStatus;

  // Resultado pendente (submetido mas não confirmado)
  submittedScoreA: number | null;
  submittedScoreB: number | null;
  submittedBy: MatchSlot | "admin" | null;
  submittedAt: string | null;

  // Disputa
  disputedAt: string | null;
  disputeReason: string | null;

  // Resultado oficial
  scoreA: number | null;
  scoreB: number | null;
  winner: MatchSlot | null;
  finalizedAt: string | null;

  // Avanço automático
  nextMatchId: string | null;
  nextMatchSlot: MatchSlot | null;

  // Provas (prints)
  proofUrlSubmitted: string | null; // print que veio junto do envio do placar
  proofUrlDisputed: string | null;  // print que veio junto da contestação

  // Auto-confirmação
  autoConfirmAt: string | null;     // quando vai auto-finalizar (calculado a partir de submittedAt)

  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function shouldUseSupabase(): boolean {
  return isSupabaseAdminConfigured();
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

function roundLabelFor(round: number, totalRounds: number): string {
  const from = totalRounds - round + 1;
  if (from === 1) return "Final";
  if (from === 2) return "Semifinal";
  if (from === 3) return "Quartas de final";
  if (from === 4) return "Oitavas de final";
  return `Rodada ${round}`;
}

/** Próxima potência de 2 ≥ n. Ex: 5 → 8, 8 → 8, 9 → 16. */
function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

// ─────────────── AUTO-CONFIRM (lazy) ───────────────
// Antes de QUALQUER leitura, finaliza matches result_submitted que passaram do prazo.
// Evita precisar de cron. Custo: 1 scan extra por leitura, aceitável.

let lastAutoConfirmCheck = 0;
const AUTO_CONFIRM_CHECK_INTERVAL_MS = 30_000; // não faz mais de 1x a cada 30s

async function runPendingAutoConfirms(): Promise<void> {
  const now = Date.now();
  if (now - lastAutoConfirmCheck < AUTO_CONFIRM_CHECK_INTERVAL_MS) return;
  lastAutoConfirmCheck = now;
  await sweepExpiredAutoConfirms();
}

/**
 * Versão forçada (sem throttle) que finaliza TODAS as partidas com
 * autoConfirmAt expirado. Usada pelo cron job /api/cron/auto-confirm-matches.
 * Retorna quantas foram processadas.
 */
export async function sweepExpiredAutoConfirms(): Promise<{ processed: number }> {
  const now = Date.now();
  const raw = shouldUseSupabase()
    ? await (async () => {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from(TABLE)
          .select("*")
          .eq("status", "result_submitted");
        return (data ?? []).map((row) => rowToMatch(row));
      })()
    : (await readJson<Match[]>(FILE, [])).filter((m) => m.status === "result_submitted");

  const expired = raw.filter(
    (m) => m.autoConfirmAt && new Date(m.autoConfirmAt).getTime() <= now
  );

  let processed = 0;
  for (const m of expired) {
    if (m.submittedScoreA == null || m.submittedScoreB == null) continue;
    const winner: MatchSlot = m.submittedScoreA > m.submittedScoreB ? "A" : "B";
    await finalizeMatch(m.id, {
      scoreA: m.submittedScoreA,
      scoreB: m.submittedScoreB,
      winner,
      autoResolved: true
    });
    processed++;
  }
  return { processed };
}

// ─────────────── READ ───────────────

export async function readAllMatches(tournamentId?: string): Promise<Match[]> {
  await runPendingAutoConfirms();
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from(TABLE)
      .select("*")
      .order("round", { ascending: true })
      .order("match_number", { ascending: true });
    if (tournamentId) query = query.eq("tournament_id", tournamentId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase readAllMatches: ${error.message}`);
    return (data ?? []).map((row) => rowToMatch(row));
  }
  const all = await readJson<Match[]>(FILE, []);
  return tournamentId ? all.filter((m) => m.tournamentId === tournamentId) : all;
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data ? rowToMatch(data) : undefined;
  }
  const all = await readJson<Match[]>(FILE, []);
  return all.find((m) => m.id === id);
}

async function persistAll(matches: Match[]): Promise<void> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const rows = matches.map(matchToRow);
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) throw new Error(`Supabase persistAll: ${error.message}`);
    return;
  }
  // Em modo fs, preserva matches de OUTROS tournaments (e atualiza/insere os novos).
  // Antes era um overwrite total que apagava matches de outros campeonatos.
  const existing = await readJson<Match[]>(FILE, []);
  const incomingIds = new Set(matches.map((m) => m.id));
  const merged = [...existing.filter((m) => !incomingIds.has(m.id)), ...matches];
  await writeJson(FILE, merged);
}

async function persistOne(updated: Match): Promise<void> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).upsert(matchToRow(updated));
    if (error) throw new Error(`Supabase persistOne: ${error.message}`);
    return;
  }
  const all = await readJson<Match[]>(FILE, []);
  const idx = all.findIndex((m) => m.id === updated.id);
  if (idx >= 0) all[idx] = updated;
  else all.push(updated);
  await writeJson(FILE, all);
}

// ─────────────── BRACKET GENERATION ───────────────

export type BracketFormat = "eliminacao" | "grupos" | "pontos";

/** Tamanho padrão dos grupos no formato "grupos". */
const GROUP_SIZE = 4;

/** Round-robin: todos contra todos numa lista. */
function roundRobinPairs<T>(players: T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]]);
    }
  }
  return pairs;
}

/** Quebra lista em grupos de no máximo `size` (último grupo pode ser menor). */
function chunkIntoGroups<T>(arr: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    groups.push(arr.slice(i, i + size));
  }
  return groups;
}

function makeBaseMatch(args: {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  roundLabel: string;
  playerA: MatchPlayer | null;
  playerB: MatchPlayer | null;
  status: MatchStatus;
  scheduledAt: string | null;
  now: string;
}): Match {
  return {
    id: args.id,
    tournamentId: args.tournamentId,
    round: args.round,
    matchNumber: args.matchNumber,
    roundLabel: args.roundLabel,
    playerA: args.playerA,
    playerB: args.playerB,
    status: args.status,
    submittedScoreA: null,
    submittedScoreB: null,
    submittedBy: null,
    submittedAt: null,
    disputedAt: null,
    disputeReason: null,
    scoreA: null,
    scoreB: null,
    winner: null,
    finalizedAt: null,
    nextMatchId: null,
    nextMatchSlot: null,
    proofUrlSubmitted: null,
    proofUrlDisputed: null,
    autoConfirmAt: null,
    scheduledAt: args.scheduledAt,
    createdAt: args.now,
    updatedAt: args.now
  };
}

export async function generateBracket(input: {
  tournamentId: string;
  participants: MatchPlayer[];
  format?: BracketFormat;
  scheduledAt?: string;
}): Promise<Match[]> {
  await deleteMatchesByTournament(input.tournamentId);
  const format = input.format ?? "eliminacao";

  let matches: Match[];
  if (format === "grupos") {
    matches = buildGroupMatches(input);
  } else if (format === "pontos") {
    matches = buildPointsMatches(input);
  } else {
    matches = buildEliminationMatches(input);
  }

  await persistAll(matches);

  // Notifica todos os participantes que o chaveamento está no ar
  const notified = new Set<string>();
  for (const p of input.participants) {
    const key = p.nickname.trim().toLowerCase();
    if (!key || notified.has(key)) continue;
    notified.add(key);
    await notifySafe({
      recipientNick: p.nickname,
      type: "bracket_generated",
      title: "Chaveamento gerado!",
      body:
        format === "grupos"
          ? "Os grupos foram sorteados. Vê tua chave."
          : format === "pontos"
            ? "A liga começou. Confere tuas partidas."
            : "A primeira rodada já está disponível.",
      link: `/campeonatos/${input.tournamentId}`
    });
  }

  // Resolve BYEs automaticamente — só faz sentido em eliminação.
  if (format === "eliminacao") {
    for (const match of matches.filter((m) => m.status === "bye")) {
      const winner: MatchSlot | null = match.playerA ? "A" : match.playerB ? "B" : null;
      if (winner) {
        await finalizeMatch(match.id, {
          scoreA: winner === "A" ? 1 : 0,
          scoreB: winner === "B" ? 1 : 0,
          winner,
          autoResolved: true
        });
      }
    }
  }

  return readAllMatches(input.tournamentId);
}

function buildEliminationMatches(input: {
  tournamentId: string;
  participants: MatchPlayer[];
  scheduledAt?: string;
  /** Soma esse valor em todos os `round` (pra empilhar depois da fase de grupos). */
  roundOffset?: number;
  /** Prefixo dos IDs (pra não colidir com matches já existentes). */
  idPrefix?: string;
}): Match[] {
  const size = nextPowerOfTwo(Math.max(2, input.participants.length));
  const totalRounds = Math.log2(size);
  const now = new Date().toISOString();
  const offset = input.roundOffset ?? 0;
  const prefix = input.idPrefix ?? "r";

  const seeded: (MatchPlayer | null)[] = [...input.participants];
  while (seeded.length < size) seeded.push(null);

  const matches: Match[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = size / 2 ** round;
    for (let i = 0; i < matchesInRound; i++) {
      const id = `${input.tournamentId}__${prefix}${round}m${i}`;
      const playerA = round === 1 ? seeded[i * 2] : null;
      const playerB = round === 1 ? seeded[i * 2 + 1] : null;

      let status: MatchStatus = round === 1 ? "pending" : "tbd";
      if (round === 1 && (!playerA || !playerB)) status = "bye";

      matches.push(
        makeBaseMatch({
          id,
          tournamentId: input.tournamentId,
          round: round + offset,
          matchNumber: i,
          roundLabel: roundLabelFor(round, totalRounds),
          playerA,
          playerB,
          status,
          scheduledAt: round === 1 ? input.scheduledAt ?? null : null,
          now
        })
      );
    }
  }

  // Linka cada match com o próximo
  for (let round = 1; round < totalRounds; round++) {
    const matchesInRound = size / 2 ** round;
    for (let i = 0; i < matchesInRound; i++) {
      const current = matches.find(
        (m) => m.round === round + offset && m.matchNumber === i
      );
      const next = matches.find(
        (m) => m.round === round + 1 + offset && m.matchNumber === Math.floor(i / 2)
      );
      if (current && next) {
        current.nextMatchId = next.id;
        current.nextMatchSlot = i % 2 === 0 ? "A" : "B";
      }
    }
  }

  return matches;
}

function buildGroupMatches(input: {
  tournamentId: string;
  participants: MatchPlayer[];
  scheduledAt?: string;
}): Match[] {
  const now = new Date().toISOString();
  const groups = chunkIntoGroups(input.participants, GROUP_SIZE);
  const matches: Match[] = [];

  groups.forEach((group, groupIdx) => {
    const letter = String.fromCharCode(65 + groupIdx); // A, B, C…
    const pairs = roundRobinPairs(group);
    pairs.forEach(([a, b], matchIdx) => {
      matches.push(
        makeBaseMatch({
          id: `${input.tournamentId}__g${groupIdx}m${matchIdx}`,
          tournamentId: input.tournamentId,
          round: groupIdx + 1, // usa "round" como índice do grupo
          matchNumber: matchIdx,
          roundLabel: `Grupo ${letter}`,
          playerA: a,
          playerB: b,
          status: "pending",
          scheduledAt: input.scheduledAt ?? null,
          now
        })
      );
    });
  });

  return matches;
}

/** Quando todos os jogos de grupos estão finalizados, monta o knockout. */
async function maybeAdvanceFromGroups(tournamentId: string): Promise<void> {
  const all = await readAllMatches(tournamentId);
  const groupMatches = all.filter((m) => /^Grupo\s/.test(m.roundLabel));
  if (groupMatches.length === 0) return;

  // Já existe fase eliminatória pós-grupos?
  const hasKnockouts = all.some((m) => !/^Grupo\s/.test(m.roundLabel));
  if (hasKnockouts) return;

  // Todas as partidas de grupo finalizadas?
  const allFinalized = groupMatches.every(
    (m) => m.status === "finalized" || m.status === "bye"
  );
  if (!allFinalized) return;

  // Top 2 de cada grupo, cross-seeded (1A vs 2B, 1B vs 2A, …) pra evitar rematch
  const standings = computeGroupStandings(groupMatches);
  const seeded: MatchPlayer[] = [];
  for (let i = 0; i < standings.length; i += 2) {
    const g1 = standings[i];
    const g2 = standings[i + 1];
    if (g1?.rows[0]) seeded.push({ nickname: g1.rows[0].nickname });
    if (g2?.rows[1]) seeded.push({ nickname: g2.rows[1].nickname });
    if (g2?.rows[0]) seeded.push({ nickname: g2.rows[0].nickname });
    if (g1?.rows[1]) seeded.push({ nickname: g1.rows[1].nickname });
  }

  if (seeded.length < 2) return;

  const groupCount = standings.length;
  const koMatches = buildEliminationMatches({
    tournamentId,
    participants: seeded,
    roundOffset: groupCount,
    idPrefix: "ko"
  });

  // Append manual — persistAll é destrutivo em modo fs, usa persistOne por match.
  for (const m of koMatches) await persistOne(m);

  // Notifica os classificados
  const notified = new Set<string>();
  for (const p of seeded) {
    const key = p.nickname.trim().toLowerCase();
    if (!key || notified.has(key)) continue;
    notified.add(key);
    await notifySafe({
      recipientNick: p.nickname,
      type: "match_ready",
      title: "Você passou pra fase eliminatória!",
      body: "Os mata-mata foram sorteados. Confere tua chave.",
      link: `/campeonatos/${tournamentId}`
    });
  }

  // Resolve BYEs eventuais do knockout
  for (const match of koMatches.filter((m) => m.status === "bye")) {
    const winner: MatchSlot | null = match.playerA ? "A" : match.playerB ? "B" : null;
    if (winner) {
      await finalizeMatch(match.id, {
        scoreA: winner === "A" ? 1 : 0,
        scoreB: winner === "B" ? 1 : 0,
        winner,
        autoResolved: true
      });
    }
  }
}

function buildPointsMatches(input: {
  tournamentId: string;
  participants: MatchPlayer[];
  scheduledAt?: string;
}): Match[] {
  const now = new Date().toISOString();
  const pairs = roundRobinPairs(input.participants);
  return pairs.map(([a, b], i) =>
    makeBaseMatch({
      id: `${input.tournamentId}__pt${i}`,
      tournamentId: input.tournamentId,
      round: 1,
      matchNumber: i,
      roundLabel: "Pontos corridos",
      playerA: a,
      playerB: b,
      status: "pending",
      scheduledAt: input.scheduledAt ?? null,
      now
    })
  );
}

export async function deleteMatchesByTournament(tournamentId: string): Promise<void> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq("tournament_id", tournamentId);
    if (error) throw new Error(`Supabase deleteMatchesByTournament: ${error.message}`);
    return;
  }
  const all = await readJson<Match[]>(FILE, []);
  const next = all.filter((m) => m.tournamentId !== tournamentId);
  await writeJson(FILE, next);
}

// ─────────────── RESULT FLOW ───────────────

export async function submitResult(
  matchId: string,
  input: { by: MatchSlot; scoreA: number; scoreB: number; proofUrl?: string | null }
): Promise<Match | { error: string }> {
  const match = await getMatchById(matchId);
  if (!match) return { error: "Match não encontrada" };
  if (match.status === "finalized") return { error: "Match já finalizada" };
  if (match.status === "tbd" || match.status === "bye") return { error: "Match não está pronta" };
  if (!Number.isFinite(input.scoreA) || !Number.isFinite(input.scoreB)) {
    return { error: "Placar inválido" };
  }
  if (input.scoreA < 0 || input.scoreB < 0) return { error: "Placar negativo" };
  if (input.scoreA === input.scoreB) return { error: "Empate não decide o avanço — defina um vencedor" };

  const now = new Date().toISOString();
  const autoConfirmAt = new Date(Date.now() + AUTO_CONFIRM_MINUTES * 60 * 1000).toISOString();
  const updated: Match = {
    ...match,
    status: "result_submitted",
    submittedScoreA: Math.floor(input.scoreA),
    submittedScoreB: Math.floor(input.scoreB),
    submittedBy: input.by,
    submittedAt: now,
    autoConfirmAt,
    proofUrlSubmitted: input.proofUrl ?? match.proofUrlSubmitted ?? null,
    updatedAt: now
  };
  await persistOne(updated);

  // Notifica o adversário que precisa confirmar
  const opponent = input.by === "A" ? updated.playerB : updated.playerA;
  if (opponent?.nickname) {
    await notifySafe({
      recipientNick: opponent.nickname,
      type: "match_result_submitted",
      title: "Resultado pendente de confirmação",
      body: `${(input.by === "A" ? updated.playerA?.nickname : updated.playerB?.nickname) ?? "Adversário"} enviou ${input.scoreA} x ${input.scoreB}. Confirme ou conteste.`,
      link: `/partidas/${updated.id}`
    });
  }

  return updated;
}

export async function confirmResult(matchId: string): Promise<Match | { error: string }> {
  const match = await getMatchById(matchId);
  if (!match) return { error: "Match não encontrada" };
  if (match.status !== "result_submitted") {
    return { error: "Sem resultado pendente pra confirmar" };
  }
  if (match.submittedScoreA == null || match.submittedScoreB == null) {
    return { error: "Resultado inválido" };
  }
  const winner: MatchSlot = match.submittedScoreA > match.submittedScoreB ? "A" : "B";
  return finalizeMatch(matchId, {
    scoreA: match.submittedScoreA,
    scoreB: match.submittedScoreB,
    winner
  });
}

export async function disputeResult(
  matchId: string,
  reason: string,
  proofUrl?: string | null
): Promise<Match | { error: string }> {
  const match = await getMatchById(matchId);
  if (!match) return { error: "Match não encontrada" };
  if (match.status !== "result_submitted") {
    return { error: "Sem resultado pendente pra contestar" };
  }
  const now = new Date().toISOString();
  const updated: Match = {
    ...match,
    status: "disputed",
    disputedAt: now,
    disputeReason: reason.trim().slice(0, 500),
    proofUrlDisputed: proofUrl ?? null,
    autoConfirmAt: null, // congela auto-confirm quando há disputa
    updatedAt: now
  };
  await persistOne(updated);

  // Notifica ambos: a disputa fica visível na timeline dos dois
  for (const p of [updated.playerA, updated.playerB]) {
    if (p?.nickname) {
      await notifySafe({
        recipientNick: p.nickname,
        type: "match_disputed",
        title: "Resultado contestado",
        body: "Admin precisa revisar. Detalhes na página da partida.",
        link: `/partidas/${updated.id}`
      });
    }
  }

  return updated;
}

export async function adminResolveMatch(
  matchId: string,
  input: { scoreA: number; scoreB: number }
): Promise<Match | { error: string }> {
  const match = await getMatchById(matchId);
  if (!match) return { error: "Match não encontrada" };
  if (match.status === "finalized" || match.status === "bye") {
    return { error: "Match já finalizada" };
  }
  if (input.scoreA === input.scoreB) return { error: "Defina um vencedor (não pode empatar)" };
  const winner: MatchSlot = input.scoreA > input.scoreB ? "A" : "B";
  return finalizeMatch(matchId, {
    scoreA: Math.floor(input.scoreA),
    scoreB: Math.floor(input.scoreB),
    winner,
    adminForced: true
  });
}

// ─────────────── FINALIZE + PROPAGATE ───────────────

async function finalizeMatch(
  matchId: string,
  input: { scoreA: number; scoreB: number; winner: MatchSlot; autoResolved?: boolean; adminForced?: boolean }
): Promise<Match> {
  const match = await getMatchById(matchId);
  if (!match) throw new Error("Match não encontrada");

  const now = new Date().toISOString();
  const finalized: Match = {
    ...match,
    status: match.status === "bye" ? "bye" : "finalized",
    scoreA: input.scoreA,
    scoreB: input.scoreB,
    winner: input.winner,
    finalizedAt: now,
    updatedAt: now
  };
  await persistOne(finalized);

  // ─── NOTIFICA AMBOS OS LADOS DO RESULTADO ───
  if (!input.autoResolved) {
    for (const p of [finalized.playerA, finalized.playerB]) {
      if (p?.nickname) {
        await notifySafe({
          recipientNick: p.nickname,
          type: "match_finalized",
          title: "Partida finalizada",
          body: `${finalized.playerA?.nickname ?? "—"} ${finalized.scoreA} x ${finalized.scoreB} ${finalized.playerB?.nickname ?? "—"}.`,
          link: `/partidas/${finalized.id}`
        });
      }
    }
  }

  // ─── AVANÇO AUTOMÁTICO ───
  await propagateWinner(finalized);

  // ─── ESCALADA GRUPOS → ELIMINAÇÃO ───
  // Se a partida era de grupo e foi a última, gera knockout automaticamente.
  if (/^Grupo\s/.test(finalized.roundLabel)) {
    await maybeAdvanceFromGroups(finalized.tournamentId);
  }

  // ─── AUTO-GRANT DO SELO DE CAMPEÃO ───
  // Quando a final é decidida (match sem nextMatchId), o vencedor ganha o selo.
  // Ignora BYEs pra não dar selo de campeonato decidido automaticamente.
  if (
    !finalized.nextMatchId &&
    finalized.status === "finalized" &&
    finalized.winner &&
    !input.autoResolved // BYE não conta como conquista
  ) {
    const champion = finalized.winner === "A" ? finalized.playerA : finalized.playerB;
    if (champion?.nickname) {
      try {
        await grantBadge({
          nickname: champion.nickname,
          grantedBy: "champion",
          reason: `Campeão de ${finalized.tournamentId}`
        });
      } catch (err) {
        console.warn(`[match-storage] auto-grant badge falhou:`, err);
      }
    }
  }

  return finalized;
}

/**
 * Pega o vencedor de um match finalizado e coloca no próximo match
 * (slot A ou B conforme nextMatchSlot). Se o próximo match também já tiver
 * os 2 lados preenchidos, ele vira "pending" (pronto pra jogar).
 */
async function propagateWinner(finishedMatch: Match): Promise<void> {
  if (!finishedMatch.nextMatchId || !finishedMatch.nextMatchSlot || !finishedMatch.winner) return;

  const nextMatch = await getMatchById(finishedMatch.nextMatchId);
  if (!nextMatch) return;

  const winnerPlayer =
    finishedMatch.winner === "A" ? finishedMatch.playerA : finishedMatch.playerB;
  if (!winnerPlayer) return;

  const updated: Match = {
    ...nextMatch,
    [finishedMatch.nextMatchSlot === "A" ? "playerA" : "playerB"]: winnerPlayer,
    updatedAt: new Date().toISOString()
  };

  // Se agora os 2 lados estão preenchidos e o match estava como tbd, vira pending
  if (updated.status === "tbd" && updated.playerA && updated.playerB) {
    updated.status = "pending";
    // Notifica os dois: têm uma nova partida pronta
    for (const p of [updated.playerA, updated.playerB]) {
      if (p?.nickname) {
        await notifySafe({
          recipientNick: p.nickname,
          type: "match_ready",
          title: "Nova partida pronta",
          body: `${updated.roundLabel}: ${updated.playerA.nickname} vs ${updated.playerB.nickname}.`,
          link: `/partidas/${updated.id}`
        });
      }
    }
  }

  // BYE cascading: se o próximo match tem só um lado preenchido e a outra vaga
  // veio de outro match que foi BYE vazio, esse também vira BYE
  // (caso raro; aqui mantém tbd se ainda falta um lado)

  await persistOne(updated);
}

// ─────────────── ROW MAPPERS ───────────────

type DbRow = {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  round_label: string;
  player_a: MatchPlayer | null;
  player_b: MatchPlayer | null;
  status: MatchStatus;
  submitted_score_a: number | null;
  submitted_score_b: number | null;
  submitted_by: MatchSlot | "admin" | null;
  submitted_at: string | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  score_a: number | null;
  score_b: number | null;
  winner: MatchSlot | null;
  finalized_at: string | null;
  next_match_id: string | null;
  next_match_slot: MatchSlot | null;
  proof_url_submitted: string | null;
  proof_url_disputed: string | null;
  auto_confirm_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToMatch(row: DbRow): Match {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    round: row.round,
    matchNumber: row.match_number,
    roundLabel: row.round_label,
    playerA: row.player_a,
    playerB: row.player_b,
    status: row.status,
    submittedScoreA: row.submitted_score_a,
    submittedScoreB: row.submitted_score_b,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    disputedAt: row.disputed_at,
    disputeReason: row.dispute_reason,
    scoreA: row.score_a,
    scoreB: row.score_b,
    winner: row.winner,
    finalizedAt: row.finalized_at,
    nextMatchId: row.next_match_id,
    nextMatchSlot: row.next_match_slot,
    proofUrlSubmitted: row.proof_url_submitted ?? null,
    proofUrlDisputed: row.proof_url_disputed ?? null,
    autoConfirmAt: row.auto_confirm_at ?? null,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function matchToRow(m: Match): DbRow {
  return {
    id: m.id,
    tournament_id: m.tournamentId,
    round: m.round,
    match_number: m.matchNumber,
    round_label: m.roundLabel,
    player_a: m.playerA,
    player_b: m.playerB,
    status: m.status,
    submitted_score_a: m.submittedScoreA,
    submitted_score_b: m.submittedScoreB,
    submitted_by: m.submittedBy,
    submitted_at: m.submittedAt,
    disputed_at: m.disputedAt,
    dispute_reason: m.disputeReason,
    score_a: m.scoreA,
    score_b: m.scoreB,
    winner: m.winner,
    finalized_at: m.finalizedAt,
    next_match_id: m.nextMatchId,
    next_match_slot: m.nextMatchSlot,
    proof_url_submitted: m.proofUrlSubmitted,
    proof_url_disputed: m.proofUrlDisputed,
    auto_confirm_at: m.autoConfirmAt,
    scheduled_at: m.scheduledAt,
    created_at: m.createdAt,
    updated_at: m.updatedAt
  };
}
