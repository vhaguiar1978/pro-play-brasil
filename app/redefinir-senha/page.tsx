import { ResetPasswordForm } from "./reset-password-form";

export default function RedefinirSenhaPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <h1>Redefinir senha</h1>
        <p className="muted">
          Crie sua nova senha para voltar a entrar no sistema com seguranca.
        </p>
      </section>

      <div className="grid cols-2">
        <div className="card">
          <ResetPasswordForm />
        </div>
        <div className="card">
          <h3>Dica</h3>
          <p className="muted">
            Use uma senha nova, forte e diferente da anterior. Depois da troca, o login volta a funcionar normalmente.
          </p>
        </div>
      </div>
    </div>
  );
}
