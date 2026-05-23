"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas nao conferem.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Senha atualizada com sucesso. Agora voce ja pode entrar na arena com a nova senha.");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar a senha agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {!ready ? (
        <div className="timer-banner">
          <strong style={{ color: "#92400e" }}>Aguardando link</strong>
          <span className="muted">
            Abra esta pagina pelo link que chegou no email de recuperacao para liberar a troca da senha.
          </span>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="new-password">Nova senha</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="confirm-password">Confirmar nova senha</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      <div className="inline-actions">
        <button className="btn btn-primary" type="submit" disabled={loading || !ready}>
          {loading ? "Atualizando..." : "Salvar nova senha"}
        </button>
        <Link href="/login" className="btn btn-ghost">
          Voltar ao login
        </Link>
      </div>

      {message ? (
        <div className="timer-banner">
          <strong style={{ color: "#047857" }}>Senha</strong>
          <span className="muted">{message}</span>
        </div>
      ) : null}
    </form>
  );
}
