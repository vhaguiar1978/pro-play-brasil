"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSuccess(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        return;
      }
      try {
        await fetch("/api/profile/sync", { method: "POST" });
      } catch {
        /* não bloqueia o login */
      }
      setSuccess(true);
      setMessage("Login confirmado. Indo pra arena...");
      setTimeout(() => {
        window.location.href = "/arena";
      }, 1200);
    } catch (err) {
      setSuccess(false);
      setMessage(err instanceof Error ? err.message : "Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {missingEnv ? (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-500/30">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Configure <code className="rounded bg-amber-500/20 px-1 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code className="rounded bg-amber-500/20 px-1 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no
            <code className="rounded bg-amber-500/20 px-1 font-mono"> .env.local</code> pra ativar o login.
          </span>
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
          E-mail
        </label>
        <div className="relative mt-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full rounded-xl border border-ppb-border bg-ppb-subtle py-3 pl-10 pr-3 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="senha" className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
            Senha
          </label>
          <Link
            href="/recuperar-senha"
            className="text-[10px] font-bold uppercase tracking-wider text-ppb-primary underline-offset-2 hover:underline"
          >
            Esqueci a senha
          </Link>
        </div>
        <div className="relative mt-1">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
          <input
            id="senha"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-ppb-border bg-ppb-subtle py-3 pl-10 pr-10 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ppb-mutedSoft hover:text-ppb-text"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ppb-primary px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-ppb-glow-strong transition hover:bg-ppb-primaryHover disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={loading || missingEnv}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar na arena
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {message ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-bold ring-1",
            success
              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
              : "bg-rose-500/10 text-rose-300 ring-rose-500/30"
          )}
          role="status"
        >
          {success ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          {message}
        </div>
      ) : null}
    </form>
  );
}
