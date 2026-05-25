"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (missingEnv) return;
    const supabase = createClient();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || Boolean(session)) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [missingEnv]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingEnv || !ready) return;
    setMessage(null);
    setStatus("idle");

    if (password.length < 6) {
      setStatus("error");
      setMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      setStatus("success");
      setMessage("Senha atualizada! Já dá pra entrar com a nova.");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {missingEnv ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Configure o Supabase para liberar a troca de senha real.
        </div>
      ) : null}

      {!missingEnv && !ready ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Abra esta página pelo link que chegou no seu e-mail. Sem ele a troca fica
          travada por segurança.
        </div>
      ) : null}

      <Field label="Nova senha" htmlFor="new-password">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-xl border border-ppb-border bg-ppb-background/50 py-3 pl-10 pr-12 text-ppb-text placeholder:text-ppb-mutedSoft/60 focus:border-ppb-primary/60 focus:outline-none focus:ring-2 focus:ring-ppb-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ppb-mutedSoft transition hover:text-ppb-text"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirmar nova senha" htmlFor="confirm-password">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
            placeholder="Repita a senha pra confirmar"
            className="w-full rounded-xl border border-ppb-border bg-ppb-background/50 py-3 pl-10 pr-3 text-ppb-text placeholder:text-ppb-mutedSoft/60 focus:border-ppb-primary/60 focus:outline-none focus:ring-2 focus:ring-ppb-primary/20"
          />
        </div>
      </Field>

      <button
        type="submit"
        disabled={loading || missingEnv || !ready}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-5 py-3 text-sm font-black uppercase tracking-wider text-ppb-background transition hover:bg-ppb-primary/90",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Atualizando…
          </>
        ) : (
          <>
            Salvar nova senha
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
          Pronto?
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
              entrar com a nova senha
            </div>
          </div>
        </div>
      </Link>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
