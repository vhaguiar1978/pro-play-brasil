// Pacotes de PPC vendidos na loja. Compartilhado entre UI (página /carteira/comprar)
// e server (criação de preference + validação no webhook).
//
// Regra de validação: o ID do pacote vai no metadata da preference do Mercado Pago.
// No webhook, validamos amount_brl bate com o pacote esperado pra evitar fraude.

export type PpcPackage = {
  id: string;
  ppc: number;
  brl: number;
  /** Texto curto pra destacar valor (ex: "Mais popular", "+20% bônus"). */
  badge?: string;
  /** Bônus visual: PPC extra dado em cima do valor base. */
  bonusPpc?: number;
};

export const PPC_PACKAGES: PpcPackage[] = [
  { id: "starter-100",  ppc: 100,  brl: 10 },
  { id: "boost-300",    ppc: 300,  brl: 25, badge: "+25 bônus", bonusPpc: 25 },
  { id: "pro-700",      ppc: 700,  brl: 50, badge: "Mais popular", bonusPpc: 100 },
  { id: "elite-1500",   ppc: 1500, brl: 100, badge: "+200 bônus", bonusPpc: 200 },
  { id: "legend-4000",  ppc: 4000, brl: 250, badge: "Melhor custo", bonusPpc: 750 }
];

export function getPackageById(id: string): PpcPackage | undefined {
  return PPC_PACKAGES.find((p) => p.id === id);
}

/** Total de PPC creditado (base + bônus). */
export function totalPpc(pkg: PpcPackage): number {
  return pkg.ppc + (pkg.bonusPpc ?? 0);
}

/** Formata o valor em reais (R$ 25,00). */
export function formatBrl(brl: number): string {
  return brl.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
}
