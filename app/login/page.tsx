import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <h1>Entrar</h1>
        <p className="muted">
          Autenticação com Supabase (email e senha). Configure{" "}
          <code style={{ color: "var(--accent)" }}>.env.local</code> com as chaves do projeto.
        </p>
      </section>

      <div className="grid cols-2">
        <div className="card">
          <LoginForm />
        </div>
        <div className="card">
          <h3>Primeiro acesso?</h3>
          <p className="muted">
            Crie sua conta para montar perfil gamer, inscrever-se em campeonatos e acompanhar
            partidas.
          </p>
          <div className="inline-actions">
            <Link href="/cadastro" className="btn btn-primary">
              Ir para cadastro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
