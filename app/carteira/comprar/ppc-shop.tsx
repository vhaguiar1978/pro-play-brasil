"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Coins, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWallet, type Wallet } from "@/lib/wallet-storage";
import { PPC_PACKAGES, formatBrl, totalPpc, type PpcPackage } from "@/lib/ppc-packages";

type CheckoutResult =
  | { ok: true; init_point: string }
  | { ok: false; error: string };

export function PpcShop() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [pendingPkgId, setPendingPkgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const w = await fetchWallet();
      setWallet(w);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  async function handleBuy(pkg: PpcPackage) {
    setError(null);
    setPendingPkgId(pkg.id);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id })
      });
      const data = (await res.json()) as CheckoutResult;
      if (!res.ok || !("init_point" in data)) {
        setError(("error" in data ? data.error : null) ?? "Falha ao criar checkout. Tente novamente.");
        return;
      }
      // Redireciona pro checkout do Mercado Pago
      window.location.href = data.init_point;
    } catch {
      setError("Falha de conexão. Tente novamente em alguns segundos.");
    } finally {
      setPendingPkgId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {/* SALDO ATUAL */}
      <div className="overflow-hidden rounded-2xl border border-ppb-primary/30 bg-gradient-to-br from-ppb-primary/15 via-ppb-surface to-ppb-surface p-5 shadow-[0_0_36px_rgba(255,106,0,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ppb-primary text-ppb-background ring-1 ring-ppb-primary/60">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
                Saldo atual
              </div>
              <div className="font-display text-3xl font-black text-ppb-text">
                {walletLoading ? (
                  <Loader2 className="inline h-6 w-6 animate-spin text-ppb-mutedSoft" />
                ) : wallet ? (
                  `${wallet.balance.toLocaleString("pt-BR")} PPC`
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshWallet}
            disabled={walletLoading}
            className="rounded-full border border-ppb-border bg-ppb-background/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-40"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* GRID DE PACOTES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PPC_PACKAGES.map((pkg) => {
          const total = totalPpc(pkg);
          const isPopular = pkg.id === "pro-700";
          const isPending = pendingPkgId === pkg.id;

          return (
            <div
              key={pkg.id}
              className={cn(
                "relative overflow-hidden rounded-3xl border bg-ppb-surface p-5 transition-all",
                isPopular
                  ? "border-ppb-primary/50 shadow-[0_0_36px_rgba(255,106,0,0.2)] md:scale-105"
                  : "border-ppb-border hover:border-ppb-primary/30"
              )}
            >
              {pkg.badge ? (
                <div
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1",
                    isPopular
                      ? "bg-ppb-primary text-ppb-background ring-ppb-primary/60"
                      : "bg-ppb-accent/15 text-ppb-accent ring-ppb-accent/30"
                  )}
                >
                  {pkg.badge}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl ring-1",
                    isPopular
                      ? "bg-ppb-primary/20 text-ppb-primary ring-ppb-primary/40"
                      : "bg-ppb-subtle text-ppb-accent ring-ppb-accent/30"
                  )}
                >
                  <Coins className="h-4 w-4" />
                </span>
                <div className="font-display text-3xl font-black text-ppb-text">
                  {total.toLocaleString("pt-BR")} <span className="text-base text-ppb-mutedSoft">PPC</span>
                </div>
              </div>

              {pkg.bonusPpc ? (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  {pkg.ppc.toLocaleString("pt-BR")} + {pkg.bonusPpc} de bônus
                </div>
              ) : null}

              <div className="mt-5 font-display text-2xl font-black uppercase text-white">
                {formatBrl(pkg.brl)}
              </div>

              <button
                type="button"
                onClick={() => handleBuy(pkg)}
                disabled={isPending || walletLoading}
                className={cn(
                  "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wider transition",
                  isPopular
                    ? "bg-ppb-primary text-ppb-background hover:bg-ppb-primary/90"
                    : "border border-ppb-primary/40 text-ppb-primary hover:bg-ppb-primary/10",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Abrindo checkout…
                  </>
                ) : (
                  <>
                    Comprar agora
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-2 text-center text-[10px] text-ppb-mutedSoft">
                Pix · cartão · boleto
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-2 rounded-2xl border border-ppb-border bg-ppb-surface/60 p-4 text-xs text-ppb-mutedSoft sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-400" /> Crédito automático após Pix aprovado
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-400" /> Comprovante por e-mail
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-400" /> Histórico em /perfil
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-400" /> Suporte em até 24h
        </div>
      </div>
    </div>
  );
}
