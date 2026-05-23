"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MercadoPagoCheckoutPayload } from "@/lib/payments";

export type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
  title: string;
  description: string;
  priceLabel: string;
  ruleNote?: string;
  showTournamentFooter?: boolean;
  ariaLabel?: string;
  checkoutPayload?: MercadoPagoCheckoutPayload;
};

export function PaywallModal({
  open,
  onClose,
  onPaid,
  title,
  description,
  priceLabel,
  ruleNote,
  showTournamentFooter = false,
  ariaLabel = "Pagamento",
  checkoutPayload
}: PaywallModalProps) {
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const realPaymentMethods = [
    {
      id: "pix",
      title: "Pix",
      description: "Aprovacao rapida para o usuario concluir o pagamento em poucos segundos."
    },
    {
      id: "credit_card",
      title: "Cartao de credito",
      description: "Pagamento no checkout oficial com cartao de credito dentro do Mercado Pago."
    },
    {
      id: "boleto",
      title: "Boleto",
      description: "Opcao liberada para quem prefere pagar por boleto bancario no mesmo checkout."
    }
  ] as const;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setCheckoutMessage(null);
      setCheckoutLoading(false);
    }
  }, [open]);

  async function handleMercadoPagoCheckout() {
    if (!checkoutPayload) return;

    try {
      setCheckoutLoading(true);
      setCheckoutMessage(null);

      const response = await fetch("/api/payments/mercado-pago/preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(checkoutPayload)
      });

      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) {
        setCheckoutMessage(data.error ?? "Nao foi possivel abrir o checkout real agora.");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : "Falha ao falar com o gateway.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: "grid", gap: 6 }}>
            <h2>{title}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {description}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            x
          </button>
        </div>

        <div className="modal-body">
          <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <span className="price-tag">
              <span className="muted">Valor</span>
              <strong>{priceLabel}</strong>
            </span>
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              {checkoutPayload ? "Pagamento real liberado" : "Pagamento interno liberado"}
            </span>
          </div>

          {checkoutPayload ? (
            <div className="stack" style={{ marginTop: 14 }}>
              <div className="card soft" style={{ padding: 16 }}>
                <strong>Formas de pagamento liberadas</strong>
                <p className="muted" style={{ marginTop: 6 }}>
                  O usuario segue para um checkout unico e escolhe entre Pix, cartao de credito ou boleto.
                </p>
              </div>

              <div className="grid cols-3">
                {realPaymentMethods.map((method) => (
                  <div key={method.id} className="card soft" style={{ padding: 16 }}>
                    <strong>{method.title}</strong>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {method.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="inline-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleMercadoPagoCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? "Abrindo pagamento..." : "Continuar para o pagamento"}
                </button>
              </div>
              {checkoutMessage ? (
                <p className="muted" role="status" style={{ marginTop: 10 }}>
                  {checkoutMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {!checkoutPayload ? (
            <div className="card soft" style={{ padding: 16, marginTop: 14 }}>
              <strong>Liberacao interna</strong>
              <p className="muted" style={{ marginTop: 6 }}>
                Este fluxo segue com confirmacao interna da plataforma para liberar a proxima etapa.
              </p>
              <div className="inline-actions">
                <button type="button" className="btn btn-primary" onClick={onPaid}>
                  Confirmar e continuar
                </button>
              </div>
            </div>
          ) : null}

          <div className="timer-banner" style={{ marginTop: 14 }}>
            <strong style={{ color: "#92400e" }}>Regra</strong>
            <span className="muted">
              {ruleNote ??
                "O pagamento segue pelo checkout oficial e a confirmacao libera a acao dentro do sistema."}
            </span>
          </div>

          <div className="inline-actions" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            {showTournamentFooter ? (
              <Link href="/criar-campeonato" className="btn btn-secondary" onClick={onClose}>
                Ver pagina de criacao
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
