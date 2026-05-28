"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAbsoluteSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingEnv) return;
    setMessage(null);
    setStatus("idle");
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/redefinir-senha`
          : getAbsoluteSiteUrl("/redefinir-senha");

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("success");
      setMessage(
        "Pronto! Enviamos um link pro seu e-mail. Confere a caixa de entrada e o spam."
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Não foi possível enviar o e-mail agora."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {missingEnv ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Configure o Supabase para liberar a recuperação real (defina{" "}
          <code className="rounded bg-amber-500/20 px-1 font-mono">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          e a anon key).
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="recover-email"
          className="block text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft"
        >
          E-mail da conta
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
          <input
            id="recover-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            required
            className="w-full rounded-xl border border-ppb-border bg-ppb-background/50 py-3 pl-10 pr-3 text-ppb-text placeholder:text-ppb-mutedSoft/60 focus:border-ppb-primary/60 focus:outline-none focus:ring-2 focus:ring-ppb-primary/20"
          />
        </div>
        <p className="text-[11px] text-ppb-mutedSoft/80">
          Usamos esse e-mail só pra mandar o link. Nada de spam.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || missingEnv}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-5 py-3 text-sm font-black uppercase tracking-wider text-ppb-background transition hover:bg-ppb-primary/90",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
          </>
        ) : (
          <>
            Enviar link de recuperação
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {status === "success" && message ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}

      {status === "error" && message ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-ppb-border" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
          Lembrou agora?
        </span>
        <div className="h-px flex-1 bg-ppb-border" />
      </div>

      <Link
        href="/login"
        className="group flex items-center justify-between gap-3 rounded-xl border border-ppb-border bg-ppb-subtle/60 p-4 transition-colors hover:border-ppb-primary/40 hover:bg-ppb-subtle"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/30">
            <ArrowRight className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold text-ppb-text">Voltar pro login</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
              entrar com sua senha
            </div>
          </div>
        </div>
      </Link>
    </form>
  );
}
