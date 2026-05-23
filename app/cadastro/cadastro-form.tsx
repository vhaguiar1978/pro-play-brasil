"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CadastroForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Conta criada. Verifique o email para confirmar (se a confirmação estiver ativa).");
    } catch (err) {
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
          Configure <code>.env.local</code> com as variáveis do Supabase para testar o cadastro.
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading || missingEnv}>
        {loading ? "Criando…" : "Criar conta"}
      </button>
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
