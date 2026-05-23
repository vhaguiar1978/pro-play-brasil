"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Trophy } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { GAMES } from "@/lib/games";
import { readArenaProfile } from "@/lib/profile-storage";
import {
  createCustomTournamentId,
  upsertCustomTournament,
  type MockTournament,
  type TournamentFormat,
  type TournamentOrigin,
  type TournamentStatus
} from "@/lib/mock-tournaments";
import { useAdminAccess } from "@/lib/use-admin-access";

const PAY_KEY = "ppb_creator_paid_v1";

type FeeMode = "free" | "ppc" | "brl";

function toDateTimeValue(isoDate: string) {
  const parsed = new Date(isoDate);
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoFromLocalDateTime(value: string) {
  if (!value) return new Date().toISOString();
  const localDate = new Date(value);
  return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60_000).toISOString();
}

function formatFeeLabel(mode: FeeMode, amount: string) {
  if (mode === "free") return null;

  const numericAmount = Number.parseFloat(amount.replace(",", "."));
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return mode === "ppc" ? "5 PPC" : "R$ 10,00";
  }

  if (mode === "ppc") {
    return `${Math.round(numericAmount)} PPC`;
  }

  return `R$ ${numericAmount.toFixed(2).replace(".", ",")}`;
}

export default function CriarCampeonatoPage() {
  const [name, setName] = useState("");
  const [gameSlug, setGameSlug] = useState(GAMES[0]?.slug ?? "fifa");
  const [platform, setPlatform] = useState("PlayStation 5, Xbox Series e PC");
  const [maxPlayers, setMaxPlayers] = useState("16");
  const [minimumPlayers, setMinimumPlayers] = useState("5");
  const [dateTime, setDateTime] = useState(toDateTimeValue("2026-04-26T21:30:00-03:00"));
  const [regionLabel, setRegionLabel] = useState("Brasil");
  const [prize, setPrize] = useState("300 PPC para o time campeão");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("grupos");
  const [status, setStatus] = useState<TournamentStatus>("open");
  const [origin, setOrigin] = useState<TournamentOrigin>("official");
  const [feeMode, setFeeMode] = useState<FeeMode>("free");
  const [feeAmount, setFeeAmount] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [createdTournament, setCreatedTournament] = useState<MockTournament | null>(null);

  const profile = useMemo(() => readArenaProfile(), []);
  const { canAccess: isAdmin } = useAdminAccess();
  const paidAt = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(PAY_KEY);
    } catch {
      return null;
    }
  }, []);

  const canCreate = isAdmin || Boolean(paidAt);
  const feeLabel = formatFeeLabel(feeMode, feeAmount);
  const selectedGame = GAMES.find((game) => game.slug === gameSlug);

  function handleCreateTournament(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPlatform = platform.trim();
    const trimmedRegion = regionLabel.trim();
    const trimmedPrize = prize.trim();
    const trimmedDescription = description.trim();

    if (!canCreate) {
      setError("Sua conta ainda não está liberada para criar campeonato.");
      return;
    }

    if (!trimmedName) {
      setError("Informe o nome do campeonato.");
      return;
    }

    if (!trimmedPlatform) {
      setError("Informe a plataforma do campeonato.");
      return;
    }

    if (!trimmedRegion) {
      setError("Informe a região do campeonato.");
      return;
    }

    if (!trimmedPrize) {
      setError("Informe a premiação do campeonato.");
      return;
    }

    const nextTournament: MockTournament = {
      id: createCustomTournamentId(trimmedName),
      name: trimmedName,
      gameSlug,
      origin,
      description:
        trimmedDescription ||
        `Campeonato criado na plataforma Pro Play Brasil para a modalidade ${selectedGame?.name ?? gameSlug}.`,
      platform: trimmedPlatform,
      maxPlayers: Number.parseInt(maxPlayers, 10) || 16,
      minimumPlayers: Number.parseInt(minimumPlayers, 10) || undefined,
      registered: 0,
      startDate: toIsoFromLocalDateTime(dateTime),
      feeLabel,
      prize: trimmedPrize,
      format,
      status,
      regionLabel: trimmedRegion,
      participants: []
    };

    upsertCustomTournament(nextTournament);
    setCreatedTournament(nextTournament);
    setName("");
    setDescription("");
    setError(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6 md:py-14">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-black tracking-tight text-ppb-text md:text-5xl">Criar campeonato</h1>
        <p className="text-ppb-muted">
          {canCreate ? (
            <>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" /> Acesso liberado
              </span>
              {profile?.gamertag ? <> · {profile.gamertag}</> : null}
            </>
          ) : (
            "Acesso bloqueado — libere em /arena/torneios"
          )}
        </p>
      </header>

      {createdTournament ? (
        <section className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 shadow-ppb-card">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-500 p-3 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-ppb-text">Campeonato publicado</h2>
                <p className="mt-1 text-sm text-ppb-muted">
                  <strong className="text-ppb-text">{createdTournament.name}</strong> já está no ar.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/campeonatos/${createdTournament.id}`} size="lg">
                Abrir
              </ButtonLink>
              <ButtonLink href="/campeonatos" variant="secondary" size="lg">
                Ver lista
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <h2 className="mb-6 text-2xl font-black text-ppb-text">Configuração</h2>

          {!canCreate ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
              <strong className="block text-base text-ppb-text">Acesso bloqueado</strong>
              Libere em{" "}
              <Link href="/arena/torneios" className="font-semibold text-ppb-primary underline underline-offset-4">
                /arena/torneios
              </Link>
              .
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={handleCreateTournament}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Nome do campeonato
                  <input
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex: FC 26 Pro Clubs - Etapa de Abertura"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Jogo / modalidade
                  <select
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={gameSlug}
                    onChange={(event) => setGameSlug(event.target.value)}
                  >
                    {GAMES.map((game) => (
                      <option key={game.slug} value={game.slug}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-ppb-text">
                Descrição pública
                <textarea
                  className="min-h-28 rounded-2xl border border-ppb-border bg-ppb-surface px-4 py-3 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Descreva rapidamente o campeonato, o formato e o diferencial do lançamento."
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Plataforma
                  <input
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                    placeholder="PC, PlayStation, Xbox..."
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Vagas máximas
                  <input
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    type="number"
                    min={2}
                    value={maxPlayers}
                    onChange={(event) => setMaxPlayers(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Mínimo por time
                  <input
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    type="number"
                    min={1}
                    value={minimumPlayers}
                    onChange={(event) => setMinimumPlayers(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Região
                  <input
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={regionLabel}
                    onChange={(event) => setRegionLabel(event.target.value)}
                    placeholder="Brasil"
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-2 text-sm font-medium text-ppb-text xl:col-span-2">
                  Data e hora de início
                  <input
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(event) => setDateTime(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Formato
                  <select
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={format}
                    onChange={(event) => setFormat(event.target.value as TournamentFormat)}
                  >
                    <option value="eliminacao">Mata-mata</option>
                    <option value="grupos">Grupos + mata-mata</option>
                    <option value="pontos">Pontos corridos</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Status inicial
                  <select
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as TournamentStatus)}
                  >
                    <option value="open">Aberto</option>
                    <option value="live">Em andamento</option>
                    <option value="finished">Finalizado</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Origem
                  <select
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value as TournamentOrigin)}
                  >
                    <option value="official">Oficial Pro Play</option>
                    <option value="community">Comunidade</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-ppb-text">
                  Premiação
                  <input
                    className="min-h-12 rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                    value={prize}
                    onChange={(event) => setPrize(event.target.value)}
                    placeholder="Ex: 300 PPC para o time campeão"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-ppb-border bg-ppb-subtle p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-ppb-primary">Cobrança</div>
                    <p className="mt-1 text-sm text-ppb-muted">
                      Gratuita, em PPC ou em reais.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "free", label: "Gratuita" },
                      { value: "ppc", label: "PPC" },
                      { value: "brl", label: "Em reais" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`min-h-11 rounded-2xl border px-4 text-sm font-semibold transition ${
                          feeMode === option.value
                            ? "border-ppb-primary bg-ppb-primary text-white"
                            : "border-ppb-border bg-ppb-surface text-ppb-text hover:border-ppb-primary/40"
                        }`}
                        onClick={() => setFeeMode(option.value as FeeMode)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {feeMode !== "free" ? (
                  <div className="mt-4 grid gap-2">
                    <label className="text-sm font-medium text-ppb-text">
                      Valor
                      <input
                        className="mt-2 min-h-12 w-full rounded-2xl border border-ppb-border bg-ppb-surface px-4 text-sm text-ppb-text outline-none transition focus:border-ppb-primary focus:ring-2 focus:ring-ppb-primary/15"
                        value={feeAmount}
                        onChange={(event) => setFeeAmount(event.target.value)}
                        placeholder={feeMode === "ppc" ? "5" : "25,00"}
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="lg">
                  Publicar campeonato
                </Button>
                <ButtonLink href="/campeonatos" variant="secondary" size="lg">
                  Cancelar
                </ButtonLink>
              </div>
            </form>
          )}
        </section>

        <aside className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
          <h2 className="mb-5 text-xl font-black text-ppb-text">Pré-visualização</h2>

          <div className="rounded-2xl border border-ppb-primary/20 bg-gradient-to-br from-ppb-primarySoft to-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ppb-primary">
                  {origin === "official" ? "Oficial" : "Comunidade"}
                </div>
                <h3 className="mt-2 text-2xl font-black text-ppb-text">{name.trim() || "Nome do campeonato"}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  status === "open"
                    ? "bg-ppb-primary text-white"
                    : status === "live"
                      ? "bg-emerald-500 text-white"
                      : "bg-white/90 text-[#0F1115] border border-white/20"
                }`}
              >
                {status === "open" ? "Aberto" : status === "live" ? "Ao vivo" : "Finalizado"}
              </span>
            </div>

            <div className="mt-5 grid gap-2.5 text-sm text-ppb-muted">
              <div className="flex items-center justify-between">
                <span>Jogo</span>
                <span className="font-semibold text-ppb-text">{selectedGame?.name ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Início</span>
                <span className="font-semibold text-ppb-text">
                  {dateTime ? new Date(dateTime).toLocaleString("pt-BR") : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vagas</span>
                <span className="font-semibold text-ppb-text">{maxPlayers || "16"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inscrição</span>
                <span className="font-semibold text-ppb-text">{feeLabel ?? "Grátis"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Prêmio</span>
                <span className="text-right font-semibold text-ppb-text">{prize || "—"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-subtle p-4">
            <Trophy className="h-5 w-5 shrink-0 text-ppb-primary" />
            <p className="text-sm text-ppb-muted">
              Após publicar, o campeonato fica visível na lista geral.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
