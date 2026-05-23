import { RecoveryForm } from "./recovery-form";

export default function RecuperarSenhaPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <h1>Recuperar senha</h1>
        <p className="muted">
          Informe o email da sua conta para receber um link seguro de recuperacao e criar uma nova senha.
        </p>
      </section>

      <div className="grid cols-2">
        <div className="card">
          <RecoveryForm />
        </div>
        <div className="card">
          <h3>Como funciona</h3>
          <p className="muted">
            O sistema envia um email com um link de acesso temporario. Ao clicar nele, voce volta para o Pro Play Brasil
            e define a nova senha na mesma hora.
          </p>
        </div>
      </div>
    </div>
  );
}
