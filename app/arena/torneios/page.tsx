"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ShieldCheck, Trophy } from "lucide-react";
import { GAMES } from "@/lib/games";
import { getAllTournaments } from "@/lib/mock-tournaments";
import { readArenaProfile } from "@/lib/profile-storage";
import { PaywallModal } from "@/components/paywall-modal";
import { ButtonLink } from "@/components/ui/button";
import { useAdminAccess } from "@/lib/use-admin-access";

const PAY_KEY = "ppb_creator_paid_v1";
const PRICE_LABEL = "R$ 9,90";

export default function ArenaTorneiosPage() {
  const [activeGame, setActiveGame] = useState<string>("all");
  const [payOpen, setPayOpen] = useState(false);

  const profile = useMemo(() => readArenaProfile(), []);
  const { canAccess: isAdmin } = useAdminAccess();

  const tournaments = useMemo(() => {
    const base = getAllTournaments();
    const filtered = activeGame === "all" ? base : base.filter((item) => item.gameSlug === activeGame);
    return [...filtered].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [activeGame]);

  function handleCreateClick() {
    if (isAdmin) {
      window.location.href = "/criar-campeonato";
      return;
    }
    setPayOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      <PaywallModal
        open={payOpen}
        ariaLabel="Pagamento para publicar campeonato"
        title="Publicação de campeonato da comunidade"
        description="Uma taxa única libera a criação de campeonato da comunidade dentro da plataforma."
        priceLabel={PRICE_LABEL}
        ruleNote='Depois da confirmação, a rota "Criar campeonato" fica liberada neste navegador.'
        showTournamentFooter
        onClose={() => setPayOpen(false)}
        onPaid={() => {
          localStorage.setItem(PAY_KEY, new Date().toISOString());
          setPayOpen(false);
          window.location.href = "/criar-campeonato";
        }}
      />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-ppb-text md:text-5xl">Arena</h1>
          <p className="text-ppb-muted">Operação de campeonatos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/campeonatos" variant="secondary" size="lg">
            Central pública
          </ButtonLink>
          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ppb-primary px-6 text-base font-semibold text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover"
            onClick={handleCreateClick}
          >
            <Plus className="h-4 w-4" />
            Criar campeonato
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Trophy className="h-5 w-5" />} label="Total" value={String(tournaments.length)} />
        <Stat
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Conta"
          value={profile?.gamertag || profile?.email || "Convidado"}
          hint={isAdmin ? "Admin" : "Comunidade"}
        />
        <div className="rounded-2xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ppb-primary">Filtro</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip active={activeGame === "all"} onClick={() => setActiveGame("all")}>
              Todos
            </FilterChip>
            {GAMES.map((game) => (
              <FilterChip
                key={game.slug}
                active={activeGame === game.slug}
                onClick={() => setActiveGame(game.slug)}
              >
                {game.name}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {tournaments.length > 0 ? (
          tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/campeonatos/${tournament.id}`}
              className="rounded-2xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card transition hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:shadow-ppb-card-hover md:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        tournament.status === "open"
                          ? "bg-ppb-primary text-white"
                          : tournament.status === "live"
                            ? "bg-emerald-500 text-white"
                            : "border border-ppb-border bg-ppb-subtle text-ppb-muted"
                      }`}
                    >
                      {tournament.status === "open"
                        ? "Aberto"
                        : tournament.status === "live"
                          ? "Ao vivo"
                          : "Finalizado"}
                    </span>
                    <span className="rounded-full border border-ppb-border bg-ppb-subtle px-3 py-1 text-xs font-semibold text-ppb-muted">
                      {tournament.origin === "official" ? "Oficial" : "Comunidade"}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-ppb-text md:text-2xl">{tournament.name}</h2>
                  <p className="max-w-3xl text-sm text-ppb-muted">
                    {tournament.description || "Campeonato pronto para receber jogadores."}
                  </p>
                </div>
                <div className="grid gap-1 text-right text-sm text-ppb-muted md:min-w-[200px]">
                  <span className="font-semibold text-ppb-text">
                    {new Date(tournament.startDate).toLocaleString("pt-BR")}
                  </span>
                  <span>{tournament.platform}</span>
                  <span>
                    {tournament.registered}/{tournament.maxPlayers} vagas
                  </span>
                  <span className="font-semibold text-ppb-primary">{tournament.prize}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-ppb-border bg-ppb-surface p-8 text-center shadow-ppb-card">
            <p className="text-ppb-muted">Nenhum campeonato neste filtro.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ppb-border bg-ppb-surface p-5 shadow-ppb-card">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-ppb-primarySoft p-2.5 text-ppb-primary">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ppb-mutedSoft">{label}</div>
          <div className="truncate text-lg font-black text-ppb-text">{value}</div>
        </div>
      </div>
      {hint ? <p className="mt-2 text-sm text-ppb-muted">{hint}</p> : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-ppb-primary bg-ppb-primary text-white"
          : "border-ppb-border bg-ppb-subtle text-ppb-muted hover:border-ppb-primary/40 hover:text-ppb-text"
      }`}
    >
      {children}
    </button>
  );
}
