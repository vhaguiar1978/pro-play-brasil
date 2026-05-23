import Link from "next/link";
import { AdminPageView } from "@/components/admin-page-view";
import { getServerAdminAccess } from "@/lib/admin-access-server";

export default async function AdminPage() {
  const { canAccess } = await getServerAdminAccess();

  if (!canAccess) {
    return (
      <div className="page">
        <section className="page-hero">
          <span className="badge community">Acesso restrito</span>
          <h1>Painel admin</h1>
          <p className="muted">
            Essa área agora depende da conta administradora autenticada no Supabase.
          </p>
        </section>

        <div className="card soft">
          <div className="inline-actions">
            <Link href="/login" className="btn btn-primary">
              Entrar com conta admin
            </Link>
            <Link href="/" className="btn btn-secondary">
              Voltar ao inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminPageView />;
}
