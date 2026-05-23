import Link from "next/link";
import { CadastroArenaForm } from "./cadastro-arena-form";
import { publicRoutes } from "@/lib/public-routes";

export default function CadastroPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <span className="badge">Bem-vindo à arena</span>
        <h1>Crie seu perfil gamer</h1>
        <p className="muted">Cadastro completo no estilo “arena” (como nas suas imagens).</p>
      </section>

      <div className="grid cols-2">
        <div className="card soft">
          <CadastroArenaForm />
        </div>
        <div className="card soft">
          <h3>Já tem conta?</h3>
          <p className="muted">Acesse com email e senha na tela de login.</p>
          <div className="inline-actions">
            <Link href={publicRoutes.login} className="btn btn-secondary">
              Ir para login
            </Link>
            <Link href="/arena" className="btn btn-ghost">
              Ver dashboard
            </Link>
          </div>
          <h3 style={{ marginTop: 24 }}>O que vem depois</h3>
          <p className="muted">
            Anúncios, chat por campeonato, amigos/DM e apostas com moeda virtual — tudo com regras e
            moderação.
          </p>
        </div>
      </div>
    </div>
  );
}
