export type CoinPack = {
  id: string;
  coins: number;
  priceBrl: number;
  label: string;
  badge?: string;
};

export const COIN_PACKS: CoinPack[] = [
  { id: "starter", coins: 20, priceBrl: 20, label: "R$ 20,00", badge: "Entrada minima" },
  { id: "smart", coins: 40, priceBrl: 35, label: "R$ 35,00" },
  { id: "best", coins: 60, priceBrl: 50, label: "R$ 50,00", badge: "Mais vantagem" }
];

export const MAX_PACK_COINS = Math.max(...COIN_PACKS.map((p) => p.coins));
export const CUSTOM_COIN_UNIT_BRL = 0.9;

export function formatBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function priceForCustomCoins(coins: number) {
  return Math.round(coins * CUSTOM_COIN_UNIT_BRL * 100) / 100;
}
