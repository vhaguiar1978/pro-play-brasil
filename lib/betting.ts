import { getGameBySlug } from "@/lib/games";
import { MOCK_MATCHES } from "@/lib/mock-matches";
import { getTournamentById } from "@/lib/mock-tournaments";

export type BetSelection = "playerA" | "playerB";
export type BetTicketStatus = "aberta" | "ganhou" | "perdeu" | "cancelada";

export type BetTicket = {
  id: string;
  marketId: string;
  matchId: string;
  tournamentId: string;
  gameSlug: string;
  userNick: string;
  createdAt: string;
  selection: BetSelection;
  selectionLabel: string;
  stake: number;
  odds: number;
  potentialReturn: number;
  status: BetTicketStatus;
  settledAt?: string;
  payout?: number;
};

export type BettingMarket = {
  id: string;
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  gameSlug: string;
  gameName: string;
  playerA: string;
  playerB: string;
  roundLabel: string;
  scheduledAt: string;
  status: "ao_vivo" | "aberto" | "fechado";
  odds: Record<BetSelection, number>;
  house: {
    seededOnA: number;
    seededOnB: number;
    maxPayout: number;
    reserveFloor: number;
  };
  rules: {
    minStake: number;
    maxBalanceShare: number;
    maxSideShare: number;
    cooldownMinutes: number;
  };
};

export type MarketSettlement = {
  winner: BetSelection | "cancelada";
  settledAt: string;
};

export type BettingMarketAdminState = {
  marketId: string;
  odds?: Partial<Record<BetSelection, number>>;
  house?: Partial<BettingMarket["house"]>;
  rules?: Partial<BettingMarket["rules"]>;
  forceClosed?: boolean;
  settlement?: MarketSettlement | null;
};

const MARKET_CONFIG = [
  {
    matchId: "m2",
    odds: { playerA: 1.82, playerB: 2.1 },
    house: { seededOnA: 220, seededOnB: 190, maxPayout: 940, reserveFloor: 420 }
  },
  {
    matchId: "m3",
    odds: { playerA: 1.9, playerB: 1.95 },
    house: { seededOnA: 180, seededOnB: 210, maxPayout: 860, reserveFloor: 390 }
  },
  {
    matchId: "m4",
    odds: { playerA: 1.74, playerB: 2.2 },
    house: { seededOnA: 260, seededOnB: 170, maxPayout: 920, reserveFloor: 410 }
  }
] as const;

const DEFAULT_RULES = {
  minStake: 10,
  maxBalanceShare: 0.15,
  maxSideShare: 0.58,
  cooldownMinutes: 2
} as const;

function normalizeNick(value: string) {
  return value.trim().toLowerCase();
}

function deriveBaseStatus(matchStatus: (typeof MOCK_MATCHES)[number]["status"]): BettingMarket["status"] {
  switch (matchStatus) {
    case "em_andamento":
      return "ao_vivo";
    case "aguardando_inicio":
      return "aberto";
    default:
      return "fechado";
  }
}

export function getBaseBettingMarkets(): BettingMarket[] {
  return MARKET_CONFIG.flatMap((seed) => {
    const match = MOCK_MATCHES.find((item) => item.id === seed.matchId);
    if (!match) return [];

    const tournament = getTournamentById(match.tournamentId);
    if (!tournament) return [];

    const game = getGameBySlug(tournament.gameSlug);

    return [
      {
        id: `bet-${match.id}`,
        matchId: match.id,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        gameSlug: tournament.gameSlug,
        gameName: game?.name ?? tournament.gameSlug,
        playerA: match.playerA.nickname,
        playerB: match.playerB.nickname,
        roundLabel: match.roundLabel,
        scheduledAt: match.scheduledAt,
        status: deriveBaseStatus(match.status),
        odds: seed.odds,
        house: seed.house,
        rules: DEFAULT_RULES
      }
    ];
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export function mergeMarketsWithAdminState(
  markets: BettingMarket[],
  adminStates: BettingMarketAdminState[]
): BettingMarket[] {
  return markets.map((market) => {
    const state = adminStates.find((item) => item.marketId === market.id);
    if (!state) return market;

    const settlementClosed = Boolean(state.settlement);

    return {
      ...market,
      status: state.forceClosed || settlementClosed ? "fechado" : market.status,
      odds: {
        ...market.odds,
        ...state.odds
      },
      house: {
        ...market.house,
        ...state.house
      },
      rules: {
        ...market.rules,
        ...state.rules
      }
    };
  });
}

export function getSelectionLabel(market: BettingMarket, selection: BetSelection) {
  return selection === "playerA" ? market.playerA : market.playerB;
}

export function formatOdd(value: number) {
  return `${value.toFixed(2)}x`;
}

export function calculateBookTotals(market: BettingMarket, bets: BetTicket[]) {
  const marketBets = bets.filter((bet) => bet.marketId === market.id && bet.status === "aberta");
  const extraOnA = marketBets
    .filter((bet) => bet.selection === "playerA")
    .reduce((sum, bet) => sum + bet.stake, 0);
  const extraOnB = marketBets
    .filter((bet) => bet.selection === "playerB")
    .reduce((sum, bet) => sum + bet.stake, 0);

  const totalOnA = market.house.seededOnA + extraOnA;
  const totalOnB = market.house.seededOnB + extraOnB;
  const totalStaked = totalOnA + totalOnB;
  const payoutIfA = totalOnA * market.odds.playerA;
  const payoutIfB = totalOnB * market.odds.playerB;
  const worstCasePayout = Math.max(payoutIfA, payoutIfB);

  return {
    totalOnA,
    totalOnB,
    totalStaked,
    payoutIfA,
    payoutIfB,
    worstCasePayout,
    remainingPayoutRoom: Math.max(0, market.house.maxPayout - worstCasePayout)
  };
}

function getSideShareCap(totalStaked: number, selectionStake: number, maxSideShare: number) {
  if (totalStaked <= 0) return 120;
  const raw = (maxSideShare * totalStaked - selectionStake) / (1 - maxSideShare);
  return Math.max(0, Math.floor(raw));
}

function getNoLossCap(market: BettingMarket, selection: BetSelection, totals: ReturnType<typeof calculateBookTotals>) {
  const odd = market.odds[selection];
  const denominator = odd - 1;
  if (denominator <= 0) return 0;

  if (selection === "playerA") {
    const numerator = totals.totalOnB - totals.totalOnA * denominator;
    return Math.max(0, Math.floor(numerator / denominator));
  }

  const numerator = totals.totalOnA - totals.totalOnB * denominator;
  return Math.max(0, Math.floor(numerator / denominator));
}

export function getHouseProtectionSnapshot(market: BettingMarket, bets: BetTicket[]) {
  const totals = calculateBookTotals(market, bets);

  return {
    sideA: getNoLossCap(market, "playerA", totals),
    sideB: getNoLossCap(market, "playerB", totals),
    worstCasePayout: totals.worstCasePayout,
    totalStaked: totals.totalStaked
  };
}

export function getStakeCap(
  market: BettingMarket,
  selection: BetSelection,
  walletBalance: number,
  bets: BetTicket[]
) {
  const totals = calculateBookTotals(market, bets);
  const selectionStake = selection === "playerA" ? totals.totalOnA : totals.totalOnB;
  const capByWallet = Math.max(0, Math.floor(walletBalance * market.rules.maxBalanceShare));
  const capByExposure = Math.max(0, Math.floor(totals.remainingPayoutRoom / market.odds[selection]));
  const capBySide = getSideShareCap(totals.totalStaked, selectionStake, market.rules.maxSideShare);
  const capByNoLoss = getNoLossCap(market, selection, totals);

  return Math.max(0, Math.min(capByWallet, capByExposure, capBySide, capByNoLoss));
}

export function getParticipantBlockReason(market: BettingMarket, gamertag: string) {
  const normalized = normalizeNick(gamertag);
  if (!normalized) return null;

  if ([market.playerA, market.playerB].some((nick) => normalizeNick(nick) === normalized)) {
    return "Seu nickname esta nesta partida. Quem participa nao pode apostar nela.";
  }

  const tournament = getTournamentById(market.tournamentId);
  if (tournament?.participants.some((participant) => normalizeNick(participant.nickname) === normalized)) {
    return "Seu nickname esta inscrito neste campeonato. Apostas ficam bloqueadas em todo o campeonato.";
  }

  return null;
}
