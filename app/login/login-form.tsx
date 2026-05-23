"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // O login nao deve falhar se a sincronizacao do perfil atrasar.
      }
      setSuccess(true);
      setMessage("Login confirmado! Redirecionando para a arena...");
      setTimeout(() => { window.location.href = "/arena"; }, 1500);
    } catch (err) {
      setSuccess(false);
      setMessage(err instanceof Error ? err.message : "Erro ao conectar ao Supabase.");
    } finally {
      setLoading(false);
    }
  }

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <form className="stack" onSubmit={onSubmit}>
      {missingEnv && (
        <p className="muted" role="status">
          Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          em <code>.env.local</code> para testar login real.
        </p>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading || missingEnv}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <div style={{ marginTop: -2 }}>
        <Link
          href="/recuperar-senha"
          className="muted"
          style={{ fontSize: "0.92rem", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Esqueci a senha
        </Link>
      </div>
      {message && (
        <p
          role="status"
          style={{
            margin: 0,
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.92rem",
            background: success ? "rgba(0, 200, 83, 0.12)" : "rgba(255, 82, 82, 0.1)",
            border: `1px solid ${success ? "rgba(0, 200, 83, 0.35)" : "rgba(255, 82, 82, 0.3)"}`,
            color: success ? "#047857" : "#b91c1c"
          }}
        >
          {success ? "✓ " : ""}{message}
        </p>
      )}
    </form>
  );
}
