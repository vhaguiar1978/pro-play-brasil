export type MercadoPagoCheckoutPayload = {
  kind: "ppc_purchase" | "tournament_fee";
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
  externalReference: string;
  metadata?: Record<string, string | number | boolean>;
};
