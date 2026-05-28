import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";
import { credit, debit } from "@/lib/wallet-server-storage";
import { getMatchById, readAllMatches } from "@/lib/match-storage";
import { readRegistrationsByTournament } from "@/lib/tournament-registrations-server-storage";

// ╔════════════════════════════════════════════════════════════════════╗
// ║  SISTEMA DE APOSTAS "CASA NUNCA PERDE"                             ║
// ║                                                                    ║
// ║  Modelo: pool betting (parimutuel) com rake fixo.                  ║
// ║  - Usuários apostam em um dos 2 lados de uma partida (A ou B).     ║
// ║  - PPC fica retido (debitado da wallet) até liquidação.            ║
// ║  - Quando match finaliza, vencedores rateiam o pool perdedor       ║
// ║    proporcional ao stake. Casa pega RAKE_PERCENT do pool total.    ║
// ║  - Casa NUNCA arrisca capital próprio.                             ║
// ║                                                                    ║
// ║  ANTI-TRAPAÇA (hard blocks no servidor):                           ║
// ║  - Não pode apostar em campeonato onde está inscrito (até ser      ║
// ║    eliminado: match anterior finalizado contra ele).               ║
// ║  - Não pode apostar em partida que está jogando.                   ║
// ║  - Apostas com cheiro de fraude viram FLAG: vão pro pool, mas o    ║
// ║    payout fica RETIDO até admin liberar/rejeitar.                  ║
// ╚════════════════════════════════════════════════════════════════════╝

const DATA_DIR = path.join(process.cwd(), "data");
const BETS_FILE = path.join(DATA_DIR, "bets.json");
const FLAGS_FILE = path.join(DATA_DIR, "fraud-flags.json");
const BETS_TABLE = "bets";
const FLAGS_TABLE = "fraud_flags";

/** % que a casa retém de cada pool. Resto vai pros vencedores. */
export const RAKE_PERCENT = 0.10;

/** Apostas abaixo desse valor não fazem sentido (custo de processamento). */
export const MIN_STAKE = 5;
/** Limite máximo por aposta — protege casa de manipulação grande. */
export const MAX_STAKE = 2000;

export type BetSide = "A" | "B";
export type BetStatus =
  | "open"           // pool aberto, aceitando apostas
  | "locked"         // partida começou, sem mais apostas
  | "settled_win"    // ganhou, payout liberado
  | "settled_loss"   // perdeu, sem payout
  | "void"           // anulada (partida cancelada), stake devolvido
  | "flagged_hold";  // suspeita: pool processou, payout retido pendente admin

export type Bet = {
  id: string;
  matchId: string;
  tournamentId: string;
  bettorNick: string;
  side: BetSide;
  stake: number;        // PPC apostado (debitado na hora)
  potentialPayout: number | null; // calculado na liquidação
  status: BetStatus;
  flagged: boolean;     // se true, há flags pendentes
  createdAt: string;
  settledAt: string | null;
  ip: string | null;    // pra cross-check de fraude
};

export type FraudFlagType =
  | "rapid_betting"          // >5 apostas em 5min
  | "high_value_new_account" // primeira aposta > 200 PPC
  | "ip_collision"           // mesmo IP, várias contas
  | "all_in_streak"          // padrão de all-in seguido
  | "admin_manual";          // admin marcou suspeita manualmente

export type FraudFlagStatus = "pending" | "approved_payout" | "rejected_void";

export type FraudFlag = {
  id: string;
  betId: string;
  type: FraudFlagType;
  score: number;             // 0-100, quanto mais alto mais suspeito
  reason: string;
  status: FraudFlagStatus;
  createdAt: string;
  resolvedAt: string | null;
  adminNote: string | null;
};

function shouldUseSupabase(): boolean {
  return isSupabaseAdminConfigured();
}

function norm(value: string): string {
  return value.trim().toLowerCase();
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

// ─────────────── ROW MAPPERS ───────────────

type BetDbRow = {
  id: string;
  match_id: string;
  tournament_id: string;
  bettor_nick: string;
  side: BetSide;
  stake: number;
  potential_payout: number | null;
  status: BetStatus;
  flagged: boolean;
  created_at: string;
  settled_at: string | null;
  ip: string | null;
};

function rowToBet(row: BetDbRow): Bet {
  return {
    id: row.id,
    matchId: row.match_id,
    tournamentId: row.tournament_id,
    bettorNick: row.bettor_nick,
    side: row.side,
    stake: row.stake,
    potentialPayout: row.potential_payout,
    status: row.status,
    flagged: row.flagged,
    createdAt: row.created_at,
    settledAt: row.settled_at,
    ip: row.ip
  };
}

function betToRow(b: Bet): BetDbRow {
  return {
    id: b.id,
    match_id: b.matchId,
    tournament_id: b.tournamentId,
    bettor_nick: b.bettorNick,
    side: b.side,
    stake: b.stake,
    potential_payout: b.potentialPayout,
    status: b.status,
    flagged: b.flagged,
    created_at: b.createdAt,
    settled_at: b.settledAt,
    ip: b.ip
  };
}

type FraudFlagDbRow = {
  id: string;
  bet_id: string;
  type: FraudFlagType;
  score: number;
  reason: string;
  status: FraudFlagStatus;
  created_at: string;
  resolved_at: string | null;
  admin_note: string | null;
};

function rowToFlag(row: FraudFlagDbRow): FraudFlag {
  return {
    id: row.id,
    betId: row.bet_id,
    type: row.type,
    score: row.score,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    adminNote: row.admin_note
  };
}

function flagToRow(f: FraudFlag): FraudFlagDbRow {
  return {
    id: f.id,
    bet_id: f.betId,
    type: f.type,
    score: f.score,
    reason: f.reason,
    status: f.status,
    created_at: f.createdAt,
    resolved_at: f.resolvedAt,
    admin_note: f.adminNote
  };
}

// ─────────────── PERSISTÊNCIA (private) ───────────────

async function readAllBets(): Promise<Bet[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(BETS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase readAllBets: ${error.message}`);
    return (data ?? []).map((row) => rowToBet(row as BetDbRow));
  }
  return readJson<Bet[]>(BETS_FILE, []);
}

async function persistBet(bet: Bet): Promise<void> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(BETS_TABLE).upsert(betToRow(bet));
    if (error) throw new Error(`Supabase persistBet: ${error.message}`);
    return;
  }
  const all = await readJson<Bet[]>(BETS_FILE, []);
  const idx = all.findIndex((b) => b.id === bet.id);
  if (idx >= 0) all[idx] = bet;
  else all.push(bet);
  await writeJson(BETS_FILE, all);
}

async function persistFlag(flag: FraudFlag): Promise<void> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(FLAGS_TABLE).upsert(flagToRow(flag));
    if (error) throw new Error(`Supabase persistFlag: ${error.message}`);
    return;
  }
  const all = await readJson<FraudFlag[]>(FLAGS_FILE, []);
  const idx = all.findIndex((f) => f.id === flag.id);
  if (idx >= 0) all[idx] = flag;
  else all.push(flag);
  await writeJson(FLAGS_FILE, all);
}

// ─────────────── READ APIs ───────────────

export async function getBetsForMatch(matchId: string): Promise<Bet[]> {
  const all = await readAllBets();
  return all.filter((b) => b.matchId === matchId);
}

export async function getBetsByNick(nick: string, limit = 50): Promise<Bet[]> {
  const key = norm(nick);
  const all = await readAllBets();
  return all
    .filter((b) => norm(b.bettorNick) === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getPendingFlags(): Promise<FraudFlag[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(FLAGS_TABLE)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase getPendingFlags: ${error.message}`);
    return (data ?? []).map((row) => rowToFlag(row as FraudFlagDbRow));
  }
  const all = await readJson<FraudFlag[]>(FLAGS_FILE, []);
  return all.filter((f) => f.status === "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─────────────── ANTI-TRAPAÇA: validações ───────────────

/**
 * Verifica se o usuário PODE apostar nesta partida.
 * Bloqueios HARD: retorna { error } e a aposta nem é criada.
 *
 * Regras:
 * 1. Não pode apostar em partida onde é playerA ou playerB
 * 2. Não pode apostar em campeonato onde está inscrito E AINDA NÃO foi eliminado
 *    (matches dele finalizados contra ele = eliminado, libera)
 */
export async function canBetOnMatch(
  nick: string,
  matchId: string
): Promise<{ ok: true } | { ok: false; error: string; code: "is_player" | "is_active_in_tournament" | "match_not_found" | "match_locked" }> {
  const key = norm(nick);

  const match = await getMatchById(matchId);
  if (!match) {
    return { ok: false, error: "Partida não encontrada", code: "match_not_found" };
  }

  // Bloqueio 0: partida já finalizada/locked
  if (match.status !== "pending") {
    return {
      ok: false,
      error: "Apostas fechadas — partida já começou ou foi finalizada",
      code: "match_locked"
    };
  }

  // Bloqueio 1: é jogador da partida
  const isPlayer =
    (match.playerA && norm(match.playerA.nickname) === key) ||
    (match.playerB && norm(match.playerB.nickname) === key);
  if (isPlayer) {
    return {
      ok: false,
      error: "Você está jogando essa partida — não pode apostar",
      code: "is_player"
    };
  }

  // Bloqueio 2: está inscrito no campeonato E ainda não foi eliminado
  const registrations = await readRegistrationsByTournament(match.tournamentId);
  const isRegistered = registrations.some((r) => norm(r.nickname) === key);
  if (isRegistered) {
    // Está inscrito. Checa se já foi eliminado:
    // - eliminado = tem match anterior finalizado onde ele foi o perdedor
    const tournamentMatches = await readAllMatches(match.tournamentId);
    const lostAny = tournamentMatches.some((m) => {
      if (m.status !== "finalized" || !m.winner) return false;
      const playerOnLosingSide = m.winner === "A" ? m.playerB : m.playerA;
      return playerOnLosingSide && norm(playerOnLosingSide.nickname) === key;
    });
    if (!lostAny) {
      return {
        ok: false,
        error: "Você está disputando esse campeonato — só pode apostar depois de eliminado",
        code: "is_active_in_tournament"
      };
    }
  }

  return { ok: true };
}

// ─────────────── ANTI-FRAUDE: heurísticas ───────────────

/**
 * Roda heurísticas sobre uma aposta recém-criada. Retorna lista de flags
 * (pode ser vazia). Cada flag tem score 0-100 e razão humana.
 *
 * Heurísticas iniciais:
 * - rapid_betting: >5 apostas do mesmo nick em últimos 5min
 * - high_value_new_account: primeira aposta + stake > 200 PPC
 * - ip_collision: mesmo IP usado por >2 nicks diferentes em 24h
 */
async function detectFraudFlags(bet: Bet): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];
  const now = Date.now();
  const all = await readAllBets();
  const sameNick = all.filter((b) => norm(b.bettorNick) === norm(bet.bettorNick));

  // 1. Rapid betting
  const last5min = sameNick.filter(
    (b) => now - new Date(b.createdAt).getTime() < 5 * 60 * 1000
  );
  if (last5min.length > 5) {
    flags.push(makeFlag(bet.id, "rapid_betting", 70, `${last5min.length} apostas em 5min`));
  }

  // 2. High value new account (primeira ou segunda aposta + stake alto)
  if (sameNick.length <= 2 && bet.stake > 200) {
    flags.push(
      makeFlag(
        bet.id,
        "high_value_new_account",
        60,
        `Conta nova apostando ${bet.stake} PPC (${sameNick.length}ª aposta)`
      )
    );
  }

  // 3. IP collision: outras contas com mesmo IP recente
  if (bet.ip) {
    const sameIp = all.filter(
      (b) =>
        b.ip === bet.ip &&
        norm(b.bettorNick) !== norm(bet.bettorNick) &&
        now - new Date(b.createdAt).getTime() < 24 * 60 * 60 * 1000
    );
    const otherNicks = new Set(sameIp.map((b) => norm(b.bettorNick)));
    if (otherNicks.size >= 2) {
      flags.push(
        makeFlag(
          bet.id,
          "ip_collision",
          85,
          `IP ${bet.ip} usado por ${otherNicks.size} outras contas em 24h`
        )
      );
    }
  }

  return flags;
}

function makeFlag(betId: string, type: FraudFlagType, score: number, reason: string): FraudFlag {
  return {
    id: randomUUID(),
    betId,
    type,
    score,
    reason,
    status: "pending",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    adminNote: null
  };
}

// ─────────────── PUBLIC: placeBet ───────────────

/**
 * Coloca uma aposta. Faz tudo o que precisa:
 * 1. Valida regras anti-trapaça (canBetOnMatch)
 * 2. Valida stake (min/max, balanço suficiente)
 * 3. Debita PPC do wallet (atomic via wallet-server-storage)
 * 4. Cria a Bet com status "open"
 * 5. Roda heurísticas de fraude. Se alguma score >= 60, marca flagged=true
 *    e cria flag pendente (mas a aposta ENTRA no pool — só o payout vai
 *    ficar retido na liquidação).
 */
export async function placeBet(input: {
  nick: string;
  matchId: string;
  side: BetSide;
  stake: number;
  ip?: string | null;
}): Promise<{ ok: true; bet: Bet; flags: FraudFlag[] } | { ok: false; error: string; code: string }> {
  const nick = input.nick.trim();
  if (!nick) return { ok: false, error: "Nickname obrigatório", code: "missing_nick" };
  if (!Number.isFinite(input.stake) || input.stake < MIN_STAKE) {
    return { ok: false, error: `Aposta mínima é ${MIN_STAKE} PPC`, code: "stake_too_low" };
  }
  if (input.stake > MAX_STAKE) {
    return { ok: false, error: `Aposta máxima é ${MAX_STAKE} PPC`, code: "stake_too_high" };
  }

  // ANTI-TRAPAÇA
  const canBet = await canBetOnMatch(nick, input.matchId);
  if (!canBet.ok) return { ok: false, error: canBet.error, code: canBet.code };

  const match = await getMatchById(input.matchId);
  if (!match) return { ok: false, error: "Partida não encontrada", code: "match_not_found" };

  // Debita PPC (transactional + ledger)
  const debited = await debit({
    nickname: nick,
    amount: input.stake,
    type: "bet_stake",
    source: input.matchId,
    note: `Aposta em ${match.roundLabel}: lado ${input.side}`
  });
  if ("error" in debited) {
    return { ok: false, error: debited.error, code: "insufficient_balance" };
  }

  // Cria Bet
  const bet: Bet = {
    id: randomUUID(),
    matchId: input.matchId,
    tournamentId: match.tournamentId,
    bettorNick: nick,
    side: input.side,
    stake: Math.floor(input.stake),
    potentialPayout: null,
    status: "open",
    flagged: false,
    createdAt: new Date().toISOString(),
    settledAt: null,
    ip: input.ip ?? null
  };

  // Heurísticas anti-fraude
  const flags = await detectFraudFlags(bet);
  if (flags.length > 0) {
    bet.flagged = true;
    for (const flag of flags) {
      await persistFlag(flag);
    }
  }

  await persistBet(bet);
  return { ok: true, bet, flags };
}

// ─────────────── LIQUIDAÇÃO ───────────────

/**
 * Liquida todas as apostas de uma partida. Chamado quando match finaliza.
 *
 * Algoritmo (pool betting):
 *   total_pool = sum(stakes_lado_A) + sum(stakes_lado_B)
 *   rake = total_pool * RAKE_PERCENT      ← casa fica
 *   payable = total_pool - rake           ← disponível pra vencedores
 *   each_winner_payout = (their_stake / sum(stakes_winning_side)) * payable
 *
 * Casos especiais:
 *   - Sem apostas em um dos lados → todos vencedores recebem stake de volta
 *     (não tem o que pagar; sem ganho/perda real, casa só pega rake do nada).
 *   - Aposta com flag pendente → status fica "flagged_hold". Payout calculado
 *     e armazenado em potentialPayout, mas NÃO creditado. Admin libera depois.
 *   - Match void/cancelled → todos recebem stake de volta.
 */
export async function settleBetsForMatch(matchId: string): Promise<{
  totalPool: number;
  rake: number;
  payable: number;
  winnersCount: number;
  losersCount: number;
  refundedCount: number;
  heldCount: number;
}> {
  const match = await getMatchById(matchId);
  if (!match) throw new Error(`Match ${matchId} não encontrada`);

  const bets = (await getBetsForMatch(matchId)).filter((b) => b.status === "open");
  if (bets.length === 0) {
    return { totalPool: 0, rake: 0, payable: 0, winnersCount: 0, losersCount: 0, refundedCount: 0, heldCount: 0 };
  }

  const winner = match.winner;
  const totalPool = bets.reduce((sum, b) => sum + b.stake, 0);
  const rake = Math.floor(totalPool * RAKE_PERCENT);
  const payable = totalPool - rake;

  // Match cancelado/sem winner → refund total (devolve stakes, sem rake)
  if (!winner || match.status !== "finalized") {
    let refunded = 0;
    for (const bet of bets) {
      await credit({
        nickname: bet.bettorNick,
        amount: bet.stake,
        type: "bet_refund",
        source: matchId,
        note: `Reembolso de aposta (partida sem resultado válido)`
      });
      bet.status = "void";
      bet.settledAt = new Date().toISOString();
      await persistBet(bet);
      refunded++;
    }
    return { totalPool, rake: 0, payable: totalPool, winnersCount: 0, losersCount: 0, refundedCount: refunded, heldCount: 0 };
  }

  const winnersBets = bets.filter((b) => b.side === winner);
  const losersBets = bets.filter((b) => b.side !== winner);

  // Edge case: ninguém apostou no lado vencedor → todos perdem
  // (casa recebe rake + sobra; isso é raro mas tecnicamente possível)
  if (winnersBets.length === 0) {
    for (const bet of losersBets) {
      bet.status = "settled_loss";
      bet.settledAt = new Date().toISOString();
      bet.potentialPayout = 0;
      await persistBet(bet);
    }
    return { totalPool, rake, payable: 0, winnersCount: 0, losersCount: losersBets.length, refundedCount: 0, heldCount: 0 };
  }

  // Edge case: ninguém apostou no lado perdedor → vencedores só recebem stake
  // de volta (sem ganho real, casa só pega rake do pool dos vencedores)
  if (losersBets.length === 0) {
    for (const bet of winnersBets) {
      const refund = bet.stake - Math.floor(bet.stake * RAKE_PERCENT);
      await credit({
        nickname: bet.bettorNick,
        amount: refund,
        type: "bet_payout",
        source: matchId,
        note: `Aposta vencedora sem oponentes — devolução parcial`
      });
      bet.status = "settled_win";
      bet.potentialPayout = refund;
      bet.settledAt = new Date().toISOString();
      await persistBet(bet);
    }
    return { totalPool, rake, payable, winnersCount: winnersBets.length, losersCount: 0, refundedCount: 0, heldCount: 0 };
  }

  // Caso normal: distribui pool proporcional ao stake dos vencedores
  const winningStakeTotal = winnersBets.reduce((sum, b) => sum + b.stake, 0);
  let heldCount = 0;
  const now = new Date().toISOString();

  for (const bet of winnersBets) {
    const share = bet.stake / winningStakeTotal;
    const payout = Math.floor(share * payable);
    bet.potentialPayout = payout;
    bet.settledAt = now;

    if (bet.flagged) {
      bet.status = "flagged_hold";
      heldCount++;
    } else {
      await credit({
        nickname: bet.bettorNick,
        amount: payout,
        type: "bet_payout",
        source: matchId,
        note: `Aposta vencedora (stake ${bet.stake}, payout ${payout})`
      });
      bet.status = "settled_win";
    }
    await persistBet(bet);
  }

  for (const bet of losersBets) {
    bet.status = "settled_loss";
    bet.potentialPayout = 0;
    bet.settledAt = now;
    await persistBet(bet);
  }

  return {
    totalPool,
    rake,
    payable,
    winnersCount: winnersBets.length,
    losersCount: losersBets.length,
    refundedCount: 0,
    heldCount
  };
}

// ─────────────── ADMIN: resolução de flags ───────────────

/**
 * Admin libera o payout retido de uma aposta flagged_hold.
 * Credita o potentialPayout e marca a flag como approved.
 */
export async function approveHeldPayout(betId: string, adminNote: string): Promise<{ ok: boolean; credited?: number; error?: string }> {
  const all = await readAllBets();
  const bet = all.find((b) => b.id === betId);
  if (!bet) return { ok: false, error: "Aposta não encontrada" };
  if (bet.status !== "flagged_hold") {
    return { ok: false, error: `Aposta não está em hold (status atual: ${bet.status})` };
  }
  const payout = bet.potentialPayout ?? 0;
  if (payout > 0) {
    await credit({
      nickname: bet.bettorNick,
      amount: payout,
      type: "bet_payout",
      source: bet.matchId,
      note: `Payout liberado pelo admin (${adminNote.slice(0, 100)})`
    });
  }
  bet.status = "settled_win";
  await persistBet(bet);

  // Marca flags da bet como aprovadas
  const flags = await readJson<FraudFlag[]>(FLAGS_FILE, []).catch(() => [] as FraudFlag[]);
  for (const flag of flags) {
    if (flag.betId !== betId || flag.status !== "pending") continue;
    flag.status = "approved_payout";
    flag.resolvedAt = new Date().toISOString();
    flag.adminNote = adminNote;
    await persistFlag(flag);
  }

  return { ok: true, credited: payout };
}

/**
 * Admin rejeita uma aposta flagged_hold (fraude confirmada).
 * Stake NÃO é devolvido (penalidade). Bet vira void com nota.
 */
export async function rejectHeldBet(betId: string, adminNote: string): Promise<{ ok: boolean; error?: string }> {
  const all = await readAllBets();
  const bet = all.find((b) => b.id === betId);
  if (!bet) return { ok: false, error: "Aposta não encontrada" };
  if (bet.status !== "flagged_hold") {
    return { ok: false, error: `Aposta não está em hold (status atual: ${bet.status})` };
  }
  bet.status = "settled_loss"; // perde por confirmação de fraude
  bet.potentialPayout = 0;
  await persistBet(bet);

  const flags = await readJson<FraudFlag[]>(FLAGS_FILE, []).catch(() => [] as FraudFlag[]);
  for (const flag of flags) {
    if (flag.betId !== betId || flag.status !== "pending") continue;
    flag.status = "rejected_void";
    flag.resolvedAt = new Date().toISOString();
    flag.adminNote = adminNote;
    await persistFlag(flag);
  }
  return { ok: true };
}
