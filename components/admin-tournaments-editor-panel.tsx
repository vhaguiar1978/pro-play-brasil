"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock3,
  Crown,
  Edit3,
  Eye,
  Loader2,
  Lock,
  Plus,
  Save,
  Swords,
  Trash2,
  Trophy,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES, getGameBySlug } from "@/lib/games";
import { MOCK_TOURNAMENTS, type MockTournament } from "@/lib/mock-tournaments";
import { StatusBadge } from "@/components/ui/status-badge";

type Status = "open" | "live" | "finished";
type Format = "eliminacao" | "grupos" | "pontos";

type FormState = {
  name: string;
  gameSlug: string;
  description: string;
  platform: string;
  maxPlayers: number;
  minimumPlayers: number;
  registered: number;
  startDate: string;
  feeLabel: string;
  prize: string;
  format: Format;
  status: Status;
  regionLabel: string;
};

type TournamentRegistration = {
  tournamentId: string;
  nickname: string;
  teamName: string;
  platform: string;
  whatsapp: string;
  paymentMethod: "free" | "mercado_pago" | "pagseguro" | "ppc";
  paymentStatus: "free" | "paid";
  createdAt: string;
};

type TournamentMatch = {
  id: string;
  round: number;
  matchNumber: number;
  roundLabel: string;
  playerA: { nickname: string; teamName?: string; whatsapp?: string } | null;
  playerB: { nickname: string; teamName?: string; whatsapp?: string } | null;
  status: "tbd" | "pending" | "result_submitted" | "disputed" | "finalized" | "bye";
  scoreA: number | null;
  scoreB: number | null;
  winner: "A" | "B" | null;
  finalizedAt: string | null;
  nextMatchId: string | null;
  scheduledAt: string | null;
};

type TournamentDetailPayload = {
  tournament: MockTournament;
  detail: {
    registrations: TournamentRegistration[];
    matches: TournamentMatch[];
    metrics: {
      registrations: number;
      matches: number;
      finalizedMatches: number;
      completionRate: number;
    };
    champion: {
      nickname: string;
      teamName: string | null;
    } | null;
    duration: {
      startedAt: string;
      finishedAt: string | null;
      label: string | null;
    };
  };
};

type SimulationLogEntry = {
  id: string;
  action: "seed" | "start" | "step" | "dispute_step" | "payments_all_paid" | "run_all" | "reset";
  message: string;
  createdAt: string;
  matchId?: string | null;
};

const EMPTY_FORM: FormState = {
  name: "",
  gameSlug: GAMES[0]?.slug ?? "",
  description: "",
  platform: "PC",
  maxPlayers: 16,
  minimumPlayers: 1,
  registered: 0,
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  feeLabel: "",
  prize: "",
  format: "eliminacao",
  status: "open",
  regionLabel: "Brasil"
};

function isoToLocal(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}

function localToIso(local: string): string {
  return new Date(local).toISOString();
}

function formatDisplay(iso: string): string {
  return new Date(iso)
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
    .replace(".", "");
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "Nao informado";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Nao informado";
  return parsed.toLocaleString("pt-BR");
}

function formatLabel(format: Format) {
  if (format === "eliminacao") return "Mata-mata";
  if (format === "grupos") return "Grupos + mata-mata";
  return "Pontos corridos";
}

type Props = {
  apiBase?: string;
  matchesBaseHref?: string;
};

export function AdminTournamentsEditorPanel({
  apiBase = "/api/admin/tournaments",
  matchesBaseHref = "/admin/campeonatos"
}: Props = {}) {
  const [serverList, setServerList] = useState<MockTournament[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [demoFormat, setDemoFormat] = useState<Format>("eliminacao");
  const [demoMode, setDemoMode] = useState<"solo" | "times">("solo");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<TournamentDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(apiBase, { cache: "no-store" });
      const data = await response.json();
      const nextList = data.tournaments ?? [];
      setServerList(nextList);
      setSelectedId((current) => {
        if (current && nextList.some((item: MockTournament) => item.id === current)) return current;
        return nextList[0]?.id ?? null;
      });
    } catch {
      setServerList([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const loadTournamentDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${apiBase}/${id}`, { cache: "no-store" });
      const data = (await response.json()) as TournamentDetailPayload;
      if (!response.ok) {
        throw new Error("Falha ao carregar campeonato.");
      }
      setSelectedDetail(data);
    } catch {
      setSelectedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    void loadTournamentDetail(selectedId);
  }, [loadTournamentDetail, selectedId]);

  function startNew() {
    setEditingId("new");
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  function startEdit(tournament: MockTournament) {
    setEditingId(tournament.id);
    setForm({
      name: tournament.name,
      gameSlug: tournament.gameSlug,
      description: tournament.description ?? "",
      platform: tournament.platform,
      maxPlayers: tournament.maxPlayers,
      minimumPlayers: tournament.minimumPlayers ?? 1,
      registered: tournament.registered,
      startDate: isoToLocal(tournament.startDate),
      feeLabel: tournament.feeLabel ?? "",
      prize: tournament.prize,
      format: tournament.format,
      status: tournament.status,
      regionLabel: tournament.regionLabel
    });
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const body = {
        name: form.name,
        gameSlug: form.gameSlug,
        description: form.description,
        platform: form.platform,
        maxPlayers: Number(form.maxPlayers),
        minimumPlayers: Number(form.minimumPlayers) || undefined,
        registered: Number(form.registered),
        startDate: localToIso(form.startDate),
        feeLabel: form.feeLabel.trim() || null,
        prize: form.prize,
        format: form.format,
        status: form.status,
        regionLabel: form.regionLabel
      };

      const isCreate = editingId === "new";
      const url = isCreate ? apiBase : `${apiBase}/${editingId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar");

      await refetch();
      const nextSelected = data.tournament?.id ?? (typeof editingId === "string" ? editingId : null);
      setEditingId(null);
      if (nextSelected) setSelectedId(nextSelected);
      setFlash(isCreate ? "Campeonato criado" : "Campeonato atualizado");
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Tem certeza? Isso vai apagar o campeonato, as inscricoes e as partidas dele.")) return;

    try {
      const response = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro");

      const remaining = serverList.filter((item) => item.id !== id);
      await refetch();
      setSelectedId(remaining[0]?.id ?? null);
      setSelectedDetail(null);
      setFlash("Campeonato removido");
      setTimeout(() => setFlash(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function createDemoTournament() {
    setCreatingDemo(true);
    setError(null);

    try {
      const game = GAMES.find((item) => item.slug === "fifa") ?? GAMES[0];
      const body = {
        name: `Demo Test Lab ${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}`,
        gameSlug: game?.slug ?? "fifa",
        description:
          demoMode === "times"
            ? "Campeonato demo por times criado para validar inscricoes, chaveamento, resultados, disputa e encerramento completo no admin."
            : "Campeonato demo individual criado para validar inscricoes, chaveamento, resultados, disputa e encerramento completo no admin.",
        platform: "PC e Console",
        maxPlayers: 8,
        minimumPlayers: demoMode === "times" ? 5 : 1,
        registered: 0,
        startDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        feeLabel: "R$ 25,00",
        prize: "R$ 500 + selo de campeao",
        format: demoFormat,
        status: "open",
        regionLabel: "Brasil"
      };

      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao criar campeonato demo");

      await refetch();
      if (data.tournament?.id) {
        setSelectedId(data.tournament.id);
      }
      setFlash("Campeonato demo criado para teste.");
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setCreatingDemo(false);
    }
  }

  const selectedTournament = useMemo(
    () => serverList.find((item) => item.id === selectedId) ?? null,
    [selectedId, serverList]
  );

  const filteredServerList = useMemo(() => {
    const term = search.trim().toLowerCase();

    return serverList.filter((tournament) => {
      const statusOk = statusFilter === "all" || tournament.status === statusFilter;
      if (!statusOk) return false;

      if (!term) return true;

      return [tournament.name, tournament.gameSlug, tournament.platform, tournament.regionLabel, tournament.prize]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [search, serverList, statusFilter]);

  return (
    <div className="space-y-5 text-ppb-text">
      <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase text-ppb-text">
                Editor de campeonatos
              </h2>
              <p className="mt-1 text-sm text-ppb-muted">
                Crie, edite, acompanhe e remova campeonatos com visao completa de participantes, campeao, progresso e duracao.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void createDemoTournament()}
              disabled={creatingDemo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-primary/35 bg-ppb-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-primary transition hover:bg-ppb-primary/18 disabled:opacity-50"
            >
              {creatingDemo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}
              Criar campeonato demo
            </button>
            <button
              type="button"
              onClick={startNew}
              disabled={editingId === "new"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ppb-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo campeonato
            </button>
          </div>
        </div>

        {flash ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            <Check className="h-3.5 w-3.5" />
            {flash}
          </div>
        ) : null}

        <div className="mt-5 rounded-[1.8rem] border border-ppb-primary/25 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.16),_transparent_24%),radial-gradient(circle_at_82%_18%,_rgba(53,194,255,0.12),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
                Ambiente de demonstracao
              </div>
              <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.04em] text-ppb-text">
                Criar campeonato demo para testar o fluxo completo
              </h3>
              <p className="mt-2 text-sm leading-7 text-ppb-muted">
                Escolha o formato, defina se o teste e individual ou por times e crie um campeonato pronto para usar no
                laboratorio logo abaixo.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:min-w-[720px]">
              <label className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Formato demo</span>
                <select
                  value={demoFormat}
                  onChange={(event) => setDemoFormat(event.target.value as Format)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white outline-none transition hover:bg-white/[0.08]"
                >
                  <option value="eliminacao">Demo mata-mata</option>
                  <option value="grupos">Demo grupos</option>
                  <option value="pontos">Demo pontos corridos</option>
                </select>
              </label>

              <label className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Modo do teste</span>
                <select
                  value={demoMode}
                  onChange={(event) => setDemoMode(event.target.value as "solo" | "times")}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white outline-none transition hover:bg-white/[0.08]"
                >
                  <option value="solo">Modo individual</option>
                  <option value="times">Modo por times</option>
                </select>
              </label>

              <div className="rounded-2xl border border-ppb-primary/25 bg-ppb-primary/10 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">Acao rapida</span>
                <button
                  type="button"
                  onClick={() => void createDemoTournament()}
                  disabled={creatingDemo}
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-ppb-primary/50 bg-[linear-gradient(135deg,rgba(255,106,0,0.98),rgba(255,138,61,0.94))] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_rgba(255,106,0,0.24)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(255,122,24,1),rgba(255,150,82,0.96))] disabled:opacity-50"
                >
                  {creatingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                  Criar campeonato demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingId !== null ? (
        <TournamentFormCard
          form={form}
          isNew={editingId === "new"}
          saving={saving}
          error={error}
          onChange={setField}
          onSave={save}
          onCancel={cancel}
        />
      ) : null}

      <Section title="Padrao do sistema" subtitle={`${MOCK_TOURNAMENTS.length} mock - nao editaveis`}>
        <ul className="grid gap-3 md:grid-cols-2">
          {MOCK_TOURNAMENTS.map((tournament) => (
            <TournamentMiniCard
              key={tournament.id}
              tournament={tournament}
              readOnly
              matchesHref={`${matchesBaseHref}/${tournament.id}/matches`}
            />
          ))}
        </ul>
      </Section>

      <Section
        title="Criados pelo admin"
        subtitle={
          loading
            ? "Carregando..."
            : `${filteredServerList.length} visiveis de ${serverList.length} no servidor`
        }
      >
        {!loading && serverList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ppb-border bg-ppb-subtle/40 p-8 text-center">
            <Trophy className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
            <p className="mt-3 text-sm text-ppb-muted">
              Nenhum campeonato criado ainda. Clique em <strong>Novo campeonato</strong> para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-3">
              <div className="rounded-2xl border border-ppb-border bg-ppb-subtle/30 p-4">
                <div className="grid gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                      Buscar campeonato
                    </label>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nome, jogo, regiao..."
                      className="ppb-input"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                      Filtrar status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as "all" | Status)}
                      className="ppb-input"
                    >
                      <option value="all">Todos</option>
                      <option value="open">Inscricoes abertas</option>
                      <option value="live">Ao vivo</option>
                      <option value="finished">Finalizado</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredServerList.length === 0 ? (
                <EmptyInline message="Nenhum campeonato encontrado com esse filtro." />
              ) : filteredServerList.map((tournament) => (
                <button
                  key={tournament.id}
                  type="button"
                  onClick={() => setSelectedId(tournament.id)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition",
                    selectedId === tournament.id
                      ? "border-ppb-primary/50 bg-ppb-primary/10 shadow-ppb-glow"
                      : "border-ppb-border bg-ppb-subtle/40 hover:border-ppb-primary/25 hover:bg-ppb-subtle"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg font-black uppercase text-ppb-text">
                        {tournament.name}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
                        {getGameBySlug(tournament.gameSlug)?.name ?? tournament.gameSlug}
                      </div>
                    </div>
                    <StatusBadge
                      tone={
                        tournament.status === "open"
                          ? "open"
                          : tournament.status === "live"
                            ? "live"
                            : "finished"
                      }
                      size="sm"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ppb-muted">
                    <span>{tournament.registered}/{tournament.maxPlayers} inscritos</span>
                    <span>{formatLabel(tournament.format)}</span>
                    <span>{tournament.regionLabel}</span>
                  </div>
                </button>
              ))}
            </aside>

            <div>
              {!selectedTournament ? (
                <EmptyState
                  title="Escolha um campeonato"
                  description="Clique em um campeonato criado pelo admin para abrir participantes, campeao, progresso, duracao e acoes de edicao."
                />
              ) : loadingDetail ? (
                <div className="space-y-4 rounded-3xl border border-ppb-border bg-ppb-surface p-5">
                  <div className="flex items-center gap-2 text-sm text-ppb-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando ficha do campeonato...
                  </div>
                </div>
              ) : selectedDetail ? (
                <TournamentDetailCard
                  payload={selectedDetail}
                  onEdit={() => startEdit(selectedDetail.tournament)}
                  onDelete={() => void remove(selectedDetail.tournament.id)}
                  onRefresh={async () => {
                    await refetch();
                    if (selectedDetail.tournament.id) {
                      await loadTournamentDetail(selectedDetail.tournament.id);
                    }
                  }}
                  publicHref={`/campeonatos/${selectedDetail.tournament.id}`}
                  matchesHref={`${matchesBaseHref}/${selectedDetail.tournament.id}/matches`}
                />
              ) : (
                <EmptyState
                  title="Nao foi possivel abrir a ficha"
                  description="A lista carregou, mas os detalhes desse campeonato nao responderam agora. Tente clicar novamente."
                />
              )}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-black uppercase text-ppb-text">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-ppb-muted">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function TournamentMiniCard({
  tournament,
  readOnly,
  onEdit,
  onDelete,
  matchesHref
}: {
  tournament: MockTournament;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  matchesHref?: string;
}) {
  const game = getGameBySlug(tournament.gameSlug);
  const statusTone =
    tournament.status === "open" ? "open" : tournament.status === "live" ? "live" : "finished";

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-ppb-border bg-ppb-subtle/40 p-3">
      <div
        className="h-12 w-12 shrink-0 rounded-xl bg-cover bg-center ring-1 ring-ppb-border"
        style={{ backgroundImage: game ? `url(${game.coverImage})` : undefined }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-ppb-text">{tournament.name}</div>
            <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ppb-primary">
              {game?.name ?? tournament.gameSlug}
            </div>
          </div>
          <StatusBadge tone={statusTone} size="sm" />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ppb-muted">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3 text-ppb-mutedSoft" />
            {formatDisplay(tournament.startDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3 text-ppb-mutedSoft" />
            {tournament.registered}/{tournament.maxPlayers}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3 text-ppb-gold" />
            {tournament.prize}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {matchesHref ? (
            <Link
              href={matchesHref}
              className="inline-flex items-center gap-1 rounded-lg border border-ppb-primary/40 bg-ppb-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-primary transition hover:bg-ppb-primary/20"
            >
              <Swords className="h-3 w-3" />
              Chaveamento
            </Link>
          ) : null}
          {!readOnly ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
              >
                <Edit3 className="h-3 w-3" />
                Editar
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-lg border border-ppb-border bg-ppb-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-rose-500/40 hover:text-rose-300"
              >
                <Trash2 className="h-3 w-3" />
                Apagar
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-ppb-subtle px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
              <Lock className="h-2.5 w-2.5" />
              Read-only
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function TournamentDetailCard({
  payload,
  onEdit,
  onDelete,
  onRefresh,
  publicHref,
  matchesHref
}: {
  payload: TournamentDetailPayload;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => Promise<void> | void;
  publicHref: string;
  matchesHref: string;
}) {
  const { tournament, detail } = payload;
  const [simulationCount, setSimulationCount] = useState(String(Math.min(Math.max(detail.metrics.registrations || 8, 8), tournament.maxPlayers)));
  const [simulationBusy, setSimulationBusy] = useState<"seed" | "start" | "step" | "dispute_step" | "payments_all_paid" | "run_all" | "reset" | null>(null);
  const [simulationFlash, setSimulationFlash] = useState<string | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<SimulationLogEntry[]>([]);
  const [lastSimulationMatchId, setLastSimulationMatchId] = useState<string | null>(null);
  const [lastSimulationReport, setLastSimulationReport] = useState<{
    registrations: number;
    matches: number;
    actionableMatches: number;
    finalizedMatches: number;
    champion: string | null;
    notifications?: number | null;
    paidRegistrations?: number | null;
    processedMatches?: number | null;
    teamMode?: boolean | null;
    teams?: number | null;
    minimumPlayers?: number | null;
    estimatedRosterSpots?: number | null;
  } | null>(null);
  const game = getGameBySlug(tournament.gameSlug);
  const statusTone =
    tournament.status === "open" ? "open" : tournament.status === "live" ? "live" : "finished";

  const recentMatches = [...detail.matches]
    .sort((a, b) => {
      const aDate = a.finalizedAt ? new Date(a.finalizedAt).getTime() : 0;
      const bDate = b.finalizedAt ? new Date(b.finalizedAt).getTime() : 0;
      return bDate - aDate || b.round - a.round || b.matchNumber - a.matchNumber;
    })
    .slice(0, 8);

  const financialSummary = useMemo(() => {
    const paidRegistrations = detail.registrations.filter((registration) => registration.paymentStatus === "paid");
    const freeRegistrations = detail.registrations.filter((registration) => registration.paymentStatus === "free");
    const normalizedFee = (tournament.feeLabel ?? "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const parsedFee = Number(normalizedFee);
    const feeValue = Number.isFinite(parsedFee) && parsedFee > 0 ? parsedFee : 0;

    return {
      paidCount: paidRegistrations.length,
      freeCount: freeRegistrations.length,
      pendingOrManualCount: Math.max(detail.registrations.length - paidRegistrations.length - freeRegistrations.length, 0),
      estimatedRevenue: feeValue > 0 ? paidRegistrations.length * feeValue : 0,
      feeValue
    };
  }, [detail.registrations, tournament.feeLabel]);

  const simulationProgress = useMemo(() => {
    const hasSeed = simulationLogs.some((entry) => entry.action === "seed");
    const hasStart = simulationLogs.some((entry) => entry.action === "start");
    const hasStep = simulationLogs.some((entry) => entry.action === "step" || entry.action === "dispute_step");
    const hasFullRun = simulationLogs.some((entry) => entry.action === "run_all");
    const hasPayments = simulationLogs.some((entry) => entry.action === "payments_all_paid");
    return { hasSeed, hasStart, hasStep, hasFullRun, hasPayments };
  }, [simulationLogs]);

  useEffect(() => {
    setSimulationLogs([]);
    setLastSimulationMatchId(null);
    setLastSimulationReport(null);
    setSimulationFlash(null);
    setSimulationCount(String(Math.min(Math.max(detail.metrics.registrations || 8, 8), tournament.maxPlayers)));
  }, [detail.metrics.registrations, tournament.id, tournament.maxPlayers]);

  async function runSimulationAction(action: "seed" | "start" | "step" | "dispute_step" | "payments_all_paid" | "run_all" | "reset") {
    setSimulationBusy(action);
    setSimulationFlash(null);

    try {
      const response = await fetch(`/api/admin/tournaments/${tournament.id}/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          participantsCount: Number(simulationCount) || 8
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || data.error || "Falha ao rodar simulacao.");
      }

      await onRefresh();
      const message =
        action === "seed"
          ? "Participantes de teste criados."
          : action === "start"
            ? "Chaveamento de teste gerado."
            : action === "step"
              ? "Proxima partida simulada."
              : action === "dispute_step"
                ? "Fluxo de disputa testado e resolvido."
                : action === "payments_all_paid"
                  ? "Pagamentos simulados e marcados como aprovados."
                : action === "run_all"
                  ? `Campeonato simulado ate o fim. ${data.processedMatches ?? 0} partidas processadas.`
                  : "Ambiente de teste resetado.";

      setSimulationFlash(message);
      setLastSimulationMatchId(data.result?.matchId ?? null);
      setLastSimulationReport(
        data.summary
          ? {
              registrations: data.summary.registrations ?? 0,
              matches: data.summary.matches ?? 0,
              actionableMatches: data.summary.actionableMatches ?? 0,
              finalizedMatches: data.summary.finalizedMatches ?? 0,
              champion: data.summary.champion ?? null,
              notifications: data.summary.notifications ?? null,
              paidRegistrations: data.summary.paidRegistrations ?? null,
              processedMatches: data.processedMatches ?? null,
              teamMode: data.summary.teamMode ?? null,
              teams: data.summary.teams ?? null,
              minimumPlayers: data.summary.minimumPlayers ?? null,
              estimatedRosterSpots: data.summary.estimatedRosterSpots ?? null
            }
          : null
      );
      setSimulationLogs((current) => [
        {
          id: `${action}-${Date.now()}`,
          action,
          message,
          createdAt: new Date().toISOString(),
          matchId: data.result?.matchId ?? null
        },
        ...current
      ].slice(0, 12));
    } catch (error) {
      setSimulationFlash(error instanceof Error ? error.message : "Falha ao rodar simulacao.");
    } finally {
      setSimulationBusy(null);
    }
  }

  function exportSimulationReport() {
    const report = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        gameSlug: tournament.gameSlug,
        status: tournament.status
      },
      summary: lastSimulationReport,
      logs: simulationLogs,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${tournament.id}-relatorio-simulacao.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 rounded-3xl border border-ppb-border bg-ppb-surface p-5">
      <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.14),_transparent_24%),radial-gradient(circle_at_80%_18%,_rgba(53,194,255,0.12),_transparent_20%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={statusTone} size="sm" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                {game?.name ?? tournament.gameSlug}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                {formatLabel(tournament.format)}
              </span>
            </div>
            <h4 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ppb-text">
              {tournament.name}
            </h4>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ppb-muted">
              {tournament.description || "Campeonato sem descricao resumida cadastrada ate o momento."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={publicHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-text transition hover:border-ppb-primary/35"
            >
              <Eye className="h-3.5 w-3.5" />
              Abrir pagina
            </Link>
            <Link
              href={matchesHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-primary/40 bg-ppb-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-primary transition hover:bg-ppb-primary/20"
            >
              <Swords className="h-3.5 w-3.5" />
              Chaveamento
            </Link>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-text transition hover:border-ppb-primary/35"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/16"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoStat label="Plataforma" value={tournament.platform} />
          <InfoStat label="Regiao" value={tournament.regionLabel} />
          <InfoStat label="Inscricao" value={tournament.feeLabel || "Gratuita"} />
          <InfoStat label="Premiacao" value={tournament.prize} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard value={`${detail.metrics.registrations}`} label="Participantes" />
        <MetricCard value={`${detail.metrics.matches}`} label="Partidas" />
        <MetricCard value={`${detail.metrics.finalizedMatches}`} label="Partidas concluidas" />
        <MetricCard value={`${detail.metrics.completionRate}%`} label="Conclusao do campeonato" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <PanelSection
          title="Resumo do campeonato"
          eyebrow="Visao geral"
          description="Aqui voce acompanha quem ganhou, quanto tempo o campeonato levou e as datas principais."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryCard
              icon={<Crown className="h-4 w-4" />}
              label="Campeao"
              value={
                detail.champion
                  ? detail.champion.teamName
                    ? `${detail.champion.nickname} • ${detail.champion.teamName}`
                    : detail.champion.nickname
                  : "Ainda sem campeao definido"
              }
            />
            <SummaryCard
              icon={<Clock3 className="h-4 w-4" />}
              label="Duracao total"
              value={detail.duration.label || "Em andamento"}
            />
            <SummaryCard
              icon={<Calendar className="h-4 w-4" />}
              label="Inicio"
              value={formatShortDate(detail.duration.startedAt)}
            />
            <SummaryCard
              icon={<Trophy className="h-4 w-4" />}
              label="Encerramento"
              value={detail.duration.finishedAt ? formatShortDate(detail.duration.finishedAt) : "Ainda nao finalizado"}
            />
          </div>
        </PanelSection>

        <PanelSection
          title="Participantes e inscritos"
          eyebrow="Pessoas"
          description="Lista completa de quem entrou no campeonato, com time, plataforma, WhatsApp e pagamento."
        >
          {detail.registrations.length === 0 ? (
            <EmptyInline message="Ainda nao existem inscricoes registradas nesse campeonato." />
          ) : (
            <div className="space-y-3">
              {detail.registrations.map((registration) => (
                <div key={`${registration.nickname}-${registration.createdAt}`} className="rounded-2xl border border-ppb-border bg-ppb-subtle/30 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-semibold text-ppb-text">
                        {registration.nickname}
                        {registration.teamName ? ` • ${registration.teamName}` : ""}
                      </div>
                      <div className="mt-1 text-sm text-ppb-muted">
                        {registration.platform} • {registration.whatsapp || "Sem WhatsApp"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SmallPill>{registration.paymentMethod}</SmallPill>
                      <SmallPill>{registration.paymentStatus}</SmallPill>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-ppb-mutedSoft">
                    Inscrito em {formatShortDate(registration.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelSection>
      </div>

      <PanelSection
        title="Laboratorio de teste"
        eyebrow="Simulacao"
        description="Popule usuarios fake, gere o chaveamento e simule o campeonato como se varios jogadores estivessem competindo ao mesmo tempo."
      >
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
              Quantos participantes fake
            </label>
            <input
              type="number"
              min={2}
              max={tournament.maxPlayers}
              value={simulationCount}
              onChange={(event) => setSimulationCount(event.target.value)}
              className="ppb-input"
            />
            <div className="mt-2 text-xs text-ppb-mutedSoft">
              Limite maximo: {tournament.maxPlayers} vagas
            </div>
            {(tournament.minimumPlayers ?? 1) > 1 ? (
              <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-3 text-xs leading-6 text-cyan-50/90">
                Cada inscricao fake simula o capitao de um time.
                {" "}
                O elenco esperado por time neste campeonato e de pelo menos
                {" "}
                <span className="font-semibold text-cyan-50">{tournament.minimumPlayers ?? 1} jogadores</span>.
              </div>
            ) : null}
          </div>

            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-5">
                <StepIndicator label="Popular teste" active={simulationProgress.hasSeed} />
                <StepIndicator label="Pagamentos" active={simulationProgress.hasPayments} />
                <StepIndicator label="Gerar bracket" active={simulationProgress.hasStart} />
                <StepIndicator label="Rodar partidas" active={simulationProgress.hasStep} />
                <StepIndicator label="Fechar torneio" active={simulationProgress.hasFullRun} />
              </div>

              <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void runSimulationAction("seed")}
                disabled={simulationBusy !== null}
                className="rounded-xl border border-ppb-primary/40 bg-ppb-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-primary transition hover:bg-ppb-primary/20 disabled:opacity-50"
              >
                {simulationBusy === "seed" ? "Criando..." : "Popular usuarios teste"}
              </button>
              <button
                type="button"
                onClick={() => void runSimulationAction("start")}
                disabled={simulationBusy !== null}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                {simulationBusy === "start" ? "Gerando..." : "Gerar chaveamento"}
              </button>
              <button
                type="button"
                onClick={() => void runSimulationAction("step")}
                disabled={simulationBusy !== null}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                {simulationBusy === "step" ? "Rodando..." : "Simular proxima partida"}
              </button>
              <button
                type="button"
                onClick={() => void runSimulationAction("dispute_step")}
                disabled={simulationBusy !== null}
                className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-200 transition hover:bg-amber-500/16 disabled:opacity-50"
              >
                {simulationBusy === "dispute_step" ? "Testando..." : "Simular disputa"}
              </button>
              <button
                type="button"
                onClick={() => void runSimulationAction("payments_all_paid")}
                disabled={simulationBusy !== null}
                className="rounded-xl border border-violet-400/35 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-100 transition hover:bg-violet-400/16 disabled:opacity-50"
              >
                {simulationBusy === "payments_all_paid" ? "Aprovando..." : "Simular pagamentos"}
              </button>
              <button
                type="button"
                onClick={() => void runSimulationAction("run_all")}
                disabled={simulationBusy !== null}
                className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200 transition hover:bg-emerald-500/16 disabled:opacity-50"
              >
                {simulationBusy === "run_all" ? "Simulando..." : "Simular campeonato completo"}
              </button>
              <button
                type="button"
                onClick={() => void runSimulationAction("reset")}
                disabled={simulationBusy !== null}
                className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/16 disabled:opacity-50"
              >
                {simulationBusy === "reset" ? "Limpando..." : "Resetar teste"}
              </button>
              {lastSimulationMatchId ? (
                <Link
                  href={`/partidas/${lastSimulationMatchId}`}
                  className="rounded-xl border border-sky-400/35 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-100 transition hover:bg-sky-400/16"
                >
                  Abrir ultima partida
                </Link>
              ) : null}
              {simulationLogs.length > 0 ? (
                <button
                  type="button"
                  onClick={exportSimulationReport}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/[0.08]"
                >
                  Exportar relatorio
                </button>
              ) : null}
            </div>

            {simulationFlash ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/78">
                {simulationFlash}
              </div>
            ) : null}
          </div>
        </div>

        {lastSimulationReport ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-9">
            <SummaryCard
              icon={<Users className="h-4 w-4" />}
              label="Inscritos no teste"
              value={`${lastSimulationReport.registrations}`}
            />
            <SummaryCard
              icon={<Users className="h-4 w-4" />}
              label="Times no teste"
              value={
                lastSimulationReport.teamMode
                  ? `${lastSimulationReport.teams ?? 0}`
                  : "Nao se aplica"
              }
            />
            <SummaryCard
              icon={<Trophy className="h-4 w-4" />}
              label="Vagas de elenco"
              value={
                lastSimulationReport.teamMode
                  ? `${lastSimulationReport.estimatedRosterSpots ?? 0}`
                  : `${lastSimulationReport.registrations}`
              }
            />
            <SummaryCard
              icon={<Swords className="h-4 w-4" />}
              label="Partidas do teste"
              value={`${lastSimulationReport.matches}`}
            />
            <SummaryCard
              icon={<Clock3 className="h-4 w-4" />}
              label="Ainda em aberto"
              value={`${lastSimulationReport.actionableMatches}`}
            />
            <SummaryCard
              icon={<Trophy className="h-4 w-4" />}
              label="Finalizadas"
              value={`${lastSimulationReport.finalizedMatches}`}
            />
            <SummaryCard
              icon={<Crown className="h-4 w-4" />}
              label="Campeao do teste"
              value={lastSimulationReport.champion || "Ainda nao definido"}
            />
            <SummaryCard
              icon={<Check className="h-4 w-4" />}
              label="Pagamentos ok"
              value={`${lastSimulationReport.paidRegistrations ?? 0}`}
            />
            <SummaryCard
              icon={<Eye className="h-4 w-4" />}
              label="Notificacoes"
              value={`${lastSimulationReport.notifications ?? 0}`}
            />
          </div>
        ) : null}

        {lastSimulationReport?.teamMode ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Leitura do modo por times
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <SummaryCard
                icon={<Crown className="h-4 w-4" />}
                label="Capitaes simulados"
                value={`${lastSimulationReport.registrations}`}
              />
              <SummaryCard
                icon={<Users className="h-4 w-4" />}
                label="Minimo por elenco"
                value={`${lastSimulationReport.minimumPlayers ?? tournament.minimumPlayers ?? 1}`}
              />
              <SummaryCard
                icon={<Check className="h-4 w-4" />}
                label="Estrutura projetada"
                value={`${lastSimulationReport.teams ?? 0} times prontos para validar`}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#101722] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Log da simulacao</div>
              <div className="mt-2 text-sm text-white/75">
                Historico das ultimas acoes disparadas no laboratorio de campeonato.
              </div>
            </div>
          </div>

          {simulationLogs.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/55">
              O log vai aparecer aqui assim que voce rodar a primeira simulacao.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {simulationLogs.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <SmallPill>{entry.action}</SmallPill>
                      <span className="text-xs text-white/45">{formatShortDate(entry.createdAt)}</span>
                    </div>
                    {entry.matchId ? (
                      <Link
                        href={`/partidas/${entry.matchId}`}
                        className="text-xs font-bold uppercase tracking-[0.14em] text-sky-200 transition hover:text-sky-100"
                      >
                        Abrir partida
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-3 text-sm text-white/82">{entry.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PanelSection>

      <PanelSection
        title="Financeiro do campeonato"
        eyebrow="Arrecadacao"
        description="Visao operacional dos pagamentos e da arrecadacao estimada com base no valor da inscricao."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Users className="h-4 w-4" />}
            label="Inscritos pagos"
            value={`${financialSummary.paidCount}`}
          />
          <SummaryCard
            icon={<Users className="h-4 w-4" />}
            label="Inscritos gratuitos"
            value={`${financialSummary.freeCount}`}
          />
          <SummaryCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Pendentes/manuais"
            value={`${financialSummary.pendingOrManualCount}`}
          />
          <SummaryCard
            icon={<Trophy className="h-4 w-4" />}
            label="Arrecadacao estimada"
            value={
              financialSummary.feeValue > 0
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.estimatedRevenue)
                : "Sem taxa em BRL"
            }
          />
        </div>
      </PanelSection>

      <PanelSection
        title="Partidas do campeonato"
        eyebrow="Andamento"
        description="Historico das partidas mais recentes para acompanhar progresso, resultado e vencedor."
      >
        {recentMatches.length === 0 ? (
          <EmptyInline message="Esse campeonato ainda nao gerou partidas ou chaveamento." />
        ) : (
          <div className="space-y-3">
            {recentMatches.map((match) => {
              const winnerName =
                match.winner === "A"
                  ? match.playerA?.nickname
                  : match.winner === "B"
                    ? match.playerB?.nickname
                    : null;

              return (
                <div key={match.id} className="rounded-2xl border border-ppb-border bg-ppb-subtle/30 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-semibold text-ppb-text">{match.roundLabel}</div>
                      <div className="mt-1 text-sm text-ppb-muted">
                        {(match.playerA?.nickname ?? "A definir")} x {(match.playerB?.nickname ?? "A definir")}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SmallPill>{match.status}</SmallPill>
                      {winnerName ? <SmallPill>Vencedor: {winnerName}</SmallPill> : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ppb-mutedSoft">
                    <span>Placar: {match.scoreA ?? "-"} x {match.scoreB ?? "-"}</span>
                    <span>Fechada em {formatShortDate(match.finalizedAt ?? match.scheduledAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelSection>
    </div>
  );
}

function TournamentFormCard({
  form,
  isNew,
  saving,
  error,
  onChange,
  onSave,
  onCancel
}: {
  form: FormState;
  isNew: boolean;
  saving: boolean;
  error: string | null;
  onChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isValid =
    form.name.trim() &&
    form.gameSlug &&
    form.platform.trim() &&
    form.prize.trim() &&
    form.regionLabel.trim() &&
    form.maxPlayers >= 2;

  return (
    <div className="rounded-3xl border border-ppb-primary/40 bg-ppb-surface p-6 shadow-ppb-glow">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isNew ? <Plus className="h-4 w-4 text-ppb-primary" /> : <Edit3 className="h-4 w-4 text-ppb-primary" />}
          <h3 className="font-display text-base font-black uppercase text-ppb-text">
            {isNew ? "Novo campeonato" : "Editar campeonato"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="grid h-8 w-8 place-items-center rounded-full text-ppb-mutedSoft hover:bg-ppb-subtle hover:text-ppb-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome do campeonato *" full>
          <input
            type="text"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            maxLength={80}
            placeholder="FC26 Pro Clubs Open"
            className="ppb-input"
          />
        </Field>

        <Field label="Jogo vinculado *">
          <select
            value={form.gameSlug}
            onChange={(event) => onChange("gameSlug", event.target.value)}
            className="ppb-input"
          >
            {GAMES.map((game) => (
              <option key={game.slug} value={game.slug}>
                {game.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(event) => onChange("status", event.target.value as Status)}
            className="ppb-input"
          >
            <option value="open">Inscricoes abertas</option>
            <option value="live">Ao vivo</option>
            <option value="finished">Encerrado</option>
          </select>
        </Field>

        <Field label="Data e horario *">
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
            className="ppb-input"
          />
        </Field>

        <Field label="Formato">
          <select
            value={form.format}
            onChange={(event) => onChange("format", event.target.value as Format)}
            className="ppb-input"
          >
            <option value="eliminacao">Mata-mata</option>
            <option value="grupos">Grupos + mata-mata</option>
            <option value="pontos">Pontos corridos</option>
          </select>
        </Field>

        <Field label="Plataforma *">
          <input
            type="text"
            value={form.platform}
            onChange={(event) => onChange("platform", event.target.value)}
            maxLength={100}
            placeholder="PC, PlayStation 5, Mobile..."
            className="ppb-input"
          />
        </Field>

        <Field label="Regiao *">
          <input
            type="text"
            value={form.regionLabel}
            onChange={(event) => onChange("regionLabel", event.target.value)}
            maxLength={60}
            placeholder="Brasil, Sudeste, Nacional..."
            className="ppb-input"
          />
        </Field>

        <Field label="Premiacao *">
          <input
            type="text"
            value={form.prize}
            onChange={(event) => onChange("prize", event.target.value)}
            maxLength={100}
            placeholder="R$ 1.000 + destaque oficial"
            className="ppb-input"
          />
        </Field>

        <Field label="Valor da inscricao">
          <input
            type="text"
            value={form.feeLabel}
            onChange={(event) => onChange("feeLabel", event.target.value)}
            placeholder="R$ 25,00 ou deixe vazio para gratis"
            className="ppb-input"
          />
        </Field>

        <Field label="Limite de participantes *">
          <input
            type="number"
            min={2}
            value={form.maxPlayers}
            onChange={(event) => onChange("maxPlayers", Number(event.target.value))}
            className="ppb-input"
          />
        </Field>

        <Field label="Minimo por time">
          <input
            type="number"
            min={1}
            value={form.minimumPlayers}
            onChange={(event) => onChange("minimumPlayers", Number(event.target.value))}
            className="ppb-input"
          />
        </Field>

        <Field label="Ja inscritos">
          <input
            type="number"
            min={0}
            value={form.registered}
            onChange={(event) => onChange("registered", Number(event.target.value))}
            className="ppb-input"
          />
        </Field>

        <Field label="Descricao / regras resumidas" full>
          <textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Resumo do regulamento que aparece na pagina do campeonato."
            className="ppb-input"
          />
          <div className="mt-1 text-right text-[10px] text-ppb-mutedSoft">{form.description.length} / 500</div>
        </Field>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-2 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-borderStrong hover:text-ppb-text disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !isValid}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition",
            isValid ? "bg-ppb-primary hover:bg-ppb-primaryHover" : "bg-ppb-subtle text-ppb-muted shadow-none"
          )}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isNew ? "Criar campeonato" : "Salvar alteracoes"}
        </button>
      </div>

      <style jsx>{`
        :global(.ppb-input) {
          margin-top: 0.25rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(17, 19, 26, 0.6);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: #ffffff;
        }
        :global(.ppb-input::placeholder) {
          color: rgba(255, 255, 255, 0.42);
        }
        :global(.ppb-input:focus) {
          outline: none;
          border-color: #ff6a00;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  full,
  children
}: {
  label: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn(full && "md:col-span-2")}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">{label}</label>
      {children}
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="font-display text-2xl font-black uppercase tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
    </div>
  );
}

function PanelSection({
  title,
  eyebrow,
  description,
  children
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.55rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/42">{eyebrow}</div>
        <h4 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.03em] text-white">{title}</h4>
        <p className="mt-2 text-sm leading-7 text-white/58">{description}</p>
      </div>
      {children}
    </section>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-3 text-sm text-white/82">{value}</div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101722] p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
        <span className="text-ppb-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-sm text-white/82">{value}</div>
    </div>
  );
}

function StepIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] transition",
        active
          ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
          : "border-white/10 bg-white/[0.03] text-white/45"
      )}
    >
      {label}
    </div>
  );
}

function SmallPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
      {children}
    </span>
  );
}

function EmptyInline({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/56">
      {message}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-[1.7rem] border border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
      <div className="max-w-lg">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/42">Gestao de campeonatos</div>
        <h3 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/58">{description}</p>
      </div>
    </div>
  );
}
