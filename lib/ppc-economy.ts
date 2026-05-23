export const PPC_MIN_PURCHASE = 20;
export const PPC_DEFAULT_TOURNAMENT_FEE = 5;
export const PPC_MIN_WITHDRAW = 20;
export const PPC_WITHDRAW_BRL_RATE = 0.75;

export function formatPpcToBrl(ppc: number) {
  return (ppc * PPC_WITHDRAW_BRL_RATE).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
