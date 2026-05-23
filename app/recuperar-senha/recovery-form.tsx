"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/redefinir-senha`
          : "https://pro-play-brasil.vercel.app/redefinir-senha";

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Enviamos um email com o link para redefinir sua senha. Confira a caixa de entrada e o spam.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel enviar o email agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {missingEnv ? (
        <p className="muted" role="status">
          Configure o Supabase para liberar a recuperacao de senha real.
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="recover-email">Email da conta</label>
        <input
          id="recover-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          required
        />
      </div>

      <div className="inline-actions">
        <button className="btn btn-primary" type="submit" disabled={loading || missingEnv}>
          {loading ? "Enviando..." : "Enviar link de recuperacao"}
        </button>
        <Link href="/login" className="btn btn-ghost">
          Voltar ao login
        </Link>
      </div>

      {message ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>Recuperacao</strong>
          <span className="muted">{message}</span>
        </div>
      ) : null}
    </form>
  );
}
