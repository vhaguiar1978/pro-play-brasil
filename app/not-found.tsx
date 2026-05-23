import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520, margin: "80px auto" }}>
        <h1 style={{ marginTop: 0 }}>Página não encontrada</h1>
        <p className="muted">A rota não existe ou o recurso foi movido.</p>
        <div className="inline-actions">
          <Link href="/" className="btn btn-primary">
            Início
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
