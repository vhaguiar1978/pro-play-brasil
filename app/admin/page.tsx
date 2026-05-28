import Link from "next/link";
import { AdminPageView } from "@/components/admin-page-view";
import { getServerAdminAccess } from "@/lib/admin-access-server";

export default async function AdminPage() {
  const { canAccess } = await getServerAdminAccess();

  if (!canAccess) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 text-white md:px-6">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.16),_transparent_28%),linear-gradient(180deg,_#0b1018_0%,_#070b12_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.3)]">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
            Acesso restrito
          </span>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.04em] text-white">
            Painel admin
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-8 text-white/64 md:text-base">
            Essa área depende da conta administradora autenticada no Supabase. O visual foi preparado para ser
            premium, mas o acesso continua protegido.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ppb-primary px-5 text-sm font-bold text-white shadow-ppb-glow">
              Entrar com conta admin
            </Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white/72 transition hover:border-white/20 hover:text-white">
              Voltar ao início
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return <AdminPageView />;
}
