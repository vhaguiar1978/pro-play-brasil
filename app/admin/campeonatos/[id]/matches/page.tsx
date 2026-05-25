import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { getServerTournamentById } from "@/lib/tournaments-server-storage";
import { MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";
import { AdminMatchesPanel } from "@/components/matches/admin-matches-panel";
import { BracketView } from "@/components/matches/bracket-view";

type Props = { params: Promise<{ id: string }> };

export default async function AdminChaveamentoPage({ params }: Props) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    redirect("/admin");
  }
  const { id } = await params;
  const fromServer = await getServerTournamentById(id);
  const fromMock = MOCK_TOURNAMENTS.find((t) => t.id === id);
  const tournament = fromServer ?? fromMock;
  if (!tournament) notFound();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
      <Link
        href="/admin"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface px-3 py-1.5 text-xs font-semibold text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao painel
      </Link>

      <AdminMatchesPanel
        tournament={{
          id: tournament.id,
          name: tournament.name,
          participants: tournament.participants,
          registered: tournament.registered,
          maxPlayers: tournament.maxPlayers
        }}
      />

      <section className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
        <h3 className="mb-4 font-display text-base font-black uppercase text-ppb-text">
          Bracket visual
        </h3>
        <BracketView tournamentId={tournament.id} />
      </section>
    </div>
  );
}
