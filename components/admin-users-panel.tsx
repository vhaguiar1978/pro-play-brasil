"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { readUserRegistry, updateUserRegistryStatus, type UserRegistryStatus } from "@/lib/user-registry";

type AdminUserRecord = {
  id: string;
  full_name: string;
  cpf: string | null;
  email: string;
  gamertag: string;
  whatsapp: string;
  platform: "PC" | "PlayStation" | "Xbox" | "Mobile" | "Crossplay";
  created_at: string;
  updated_at: string;
  status: UserRegistryStatus;
  penalty_reason: string;
  is_admin: boolean;
};

type AdminLabelRecord = {
  id: string;
  name: string;
  color: string | null;
};

type AdminUserDetail = {
  profile: AdminUserRecord;
  labels: AdminLabelRecord[];
  wallet: {
    nickname: string;
    balance: number;
    updated_at: string;
  } | null;
  registrations: Array<{
    tournament_id: string;
    nickname: string;
    team_name: string | null;
    platform: string;
    whatsapp: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
  }>;
  purchases: Array<{
    id: string;
    nickname: string;
    package_id: string;
    amount_ppc: number;
    amount_brl: number;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  withdrawals: Array<{
    id: string;
    user_id: string;
    nickname: string;
    full_name: string;
    ppc_amount: number;
    brl_estimate: number;
    status: string;
    admin_note: string | null;
    created_at: string;
    processed_at: string | null;
  }>;
  metrics: {
    registrations: number | null;
    purchases: number | null;
    withdrawals: number | null;
  };
};

function duplicateSnapshot(user: AdminUserRecord, users: AdminUserRecord[]) {
  const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
  const onlyDigits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

  const sameCpf = users.filter((item) => item.id !== user.id && onlyDigits(item.cpf) && onlyDigits(item.cpf) === onlyDigits(user.cpf)).length;
  const sameEmail = users.filter((item) => item.id !== user.id && normalizeText(item.email) === normalizeText(user.email)).length;
  const sameGamertag = users.filter((item) => item.id !== user.id && normalizeText(item.gamertag) === normalizeText(user.gamertag)).length;

  return {
    sameCpf,
    sameEmail,
    sameGamertag,
    riskLevel: sameCpf > 0 || sameEmail > 0 ? "high" : sameGamertag > 0 ? "medium" : "low"
  } as const;
}

function readLocalUsers(): AdminUserRecord[] {
  return readUserRegistry().map((user) => ({
    id: user.id,
    full_name: user.fullName,
    cpf: user.cpf,
    email: user.email,
    gamertag: user.gamertag,
    whatsapp: user.whatsapp,
    platform: user.platform,
    created_at: user.createdAt,
    updated_at: user.lastSeenAt,
    status: user.status,
    penalty_reason: user.penaltyReason,
    is_admin: false
  }));
}

function buildWhatsAppLink(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Nao informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Nao informado";
  return parsed.toLocaleString("pt-BR");
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function slugToLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminUserDetail | null>(null);
  const [search, setSearch] = useState("");
  const [statusDraft, setStatusDraft] = useState<UserRegistryStatus>("active");
  const [reasonDraft, setReasonDraft] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingControl, setSavingControl] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [user.full_name, user.email, user.gamertag, user.whatsapp, user.cpf ?? "", user.platform]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const refreshUsers = useCallback(async (preferredUserId?: string | null) => {
    setLoadingUsers(true);
    let nextUsers: AdminUserRecord[] | null = null;
    let localFallback = false;

    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; users?: AdminUserRecord[] };

      if (response.ok && payload.ok && Array.isArray(payload.users)) {
        nextUsers = payload.users;
      }
    } catch {
      // fallback handled below
    }

    if (!nextUsers) {
      nextUsers = readLocalUsers();
      localFallback = true;
    }

    setUsingLocalFallback(localFallback);
    setUsers(nextUsers);
    setLoadingUsers(false);

    setSelectedUserId((current) => {
      const desired = preferredUserId ?? current ?? nextUsers?.[0]?.id ?? null;
      if (desired && nextUsers?.some((user) => user.id === desired)) return desired;
      return nextUsers?.[0]?.id ?? null;
    });
  }, []);

  const loadUserDetail = useCallback(async (userId: string) => {
    const fallbackUser = users.find((user) => user.id === userId) ?? null;
    setLoadingDetail(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; detail?: AdminUserDetail };

      if (response.ok && payload.ok && payload.detail) {
        setSelectedDetail(payload.detail);
        setStatusDraft(payload.detail.profile.status);
        setReasonDraft(payload.detail.profile.penalty_reason ?? "");
        setLoadingDetail(false);
        return;
      }
    } catch {
      // fallback handled below
    }

    if (fallbackUser) {
      setSelectedDetail({
        profile: fallbackUser,
        labels: [],
        wallet: null,
        registrations: [],
        purchases: [],
        withdrawals: [],
        metrics: {
          registrations: null,
          purchases: null,
          withdrawals: null
        }
      });
      setStatusDraft(fallbackUser.status);
      setReasonDraft(fallbackUser.penalty_reason ?? "");
    } else {
      setSelectedDetail(null);
    }

    setLoadingDetail(false);
  }, [users]);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedDetail(null);
      return;
    }

    void loadUserDetail(selectedUserId);
  }, [loadUserDetail, selectedUserId]);

  async function saveStatus() {
    if (!selectedUserId) return;

    setSavingControl(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: statusDraft, penaltyReason: reasonDraft })
      });

      if (response.ok) {
        await refreshUsers(selectedUserId);
        await loadUserDetail(selectedUserId);
        setFlash("Controle do usuario atualizado.");
        setSavingControl(false);
        return;
      }
    } catch {
      // fallback handled below
    }

    updateUserRegistryStatus(selectedUserId, statusDraft, reasonDraft);
    await refreshUsers(selectedUserId);
    await loadUserDetail(selectedUserId);
    setFlash("Controle do usuario atualizado no registro local.");
    setSavingControl(false);
  }

  async function deleteUser(userId: string) {
    setDeletingUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        const remaining = users.filter((user) => user.id !== userId);
        setConfirmDeleteId(null);
        setSelectedDetail(null);
        await refreshUsers(remaining[0]?.id ?? null);
        setFlash("Usuario excluido com sucesso.");
        setDeletingUserId(null);
        return;
      }
    } catch {
      // fallback handled below
    }

    const remaining = users.filter((user) => user.id !== userId);
    setUsers(remaining);
    setSelectedUserId(remaining[0]?.id ?? null);
    setConfirmDeleteId(null);
    setSelectedDetail(null);
    setFlash("Usuario removido da lista local.");
    setDeletingUserId(null);
  }

  return (
    <div className="space-y-6">
      {flash ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {flash}
        </div>
      ) : null}

      <section className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-ppb-primary/25 bg-ppb-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              Gestao de usuarios
            </div>
            <div>
              <h3 className="font-display text-3xl font-black uppercase tracking-[-0.04em] text-white">
                Lista clicavel com visao completa do jogador
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/64">
                Agora o admin consegue navegar por usuarios, abrir os dados principais, enxergar risco de duplicidade,
                acompanhar carteira, inscricoes, compras e saques sem ficar preso em uma lista longa e confusa.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard value={`${users.length}`} label="Usuarios na fila" />
            <MetricCard value={`${users.filter((user) => user.status !== "active").length}`} label="Com restricao" />
            <MetricCard value={usingLocalFallback ? "Local" : "Supabase"} label="Origem da leitura" />
          </div>
        </div>
      </section>

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-md rounded-[1.8rem] border border-red-500/30 bg-[#11151d] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
            <div className="inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">
              Excluir usuario
            </div>
            <h3 className="mt-4 font-display text-2xl font-black uppercase tracking-[-0.03em] text-white">
              Confirmar exclusao permanente
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Essa acao remove a conta e os dados relacionados de inscricoes, carteira, saques e historicos conectados.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/25"
                onClick={() => void deleteUser(confirmDeleteId)}
                disabled={deletingUserId === confirmDeleteId}
              >
                {deletingUserId === confirmDeleteId ? "Excluindo..." : "Sim, excluir"}
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-[1.8rem] border border-white/10 bg-[#0d121b] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Base de usuarios</div>
              <h4 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.03em] text-white">
                Lista do admin
              </h4>
            </div>

            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Buscar
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, gamertag, email, WhatsApp..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-ppb-primary/50 focus:bg-white/[0.08]"
              />
            </label>

            <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="mt-4 h-5 w-36 rounded bg-white/10" />
                    <div className="mt-3 h-3 w-full rounded bg-white/10" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
                  </div>
                ))
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/56">
                  Nenhum usuario encontrado com esse filtro.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const duplicate = duplicateSnapshot(user, users);
                  const active = user.id === selectedUserId;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                        active
                          ? "border-ppb-primary/55 bg-ppb-primary/10 shadow-[0_18px_40px_rgba(255,106,0,0.12)]"
                          : "border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={user.status === "active" ? "success" : user.status === "penalized" ? "warning" : "danger"}>
                          {user.status === "active" ? "Ativo" : user.status === "penalized" ? "Penalizado" : "Banido"}
                        </Badge>
                        {user.is_admin ? <Badge tone="info">Admin</Badge> : null}
                        {duplicate.riskLevel !== "low" ? (
                          <Badge tone={duplicate.riskLevel === "high" ? "danger" : "warning"}>
                            {duplicate.riskLevel === "high" ? "Risco alto" : "Atencao"}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <div className="font-display text-xl font-black uppercase tracking-[-0.03em] text-white">
                          {user.gamertag || "Sem gamertag"}
                        </div>
                        <div className="mt-1 text-sm text-white/66">{user.full_name}</div>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-white/52">
                        <div>{user.email}</div>
                        <div>{user.platform}</div>
                        <div>Criado em {formatDateTime(user.created_at)}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <section className="rounded-[1.8rem] border border-white/10 bg-[#0d121b] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          {!selectedUser ? (
            <EmptyState
              title="Escolha um usuario"
              description="Selecione um nome na lista ao lado para abrir a ficha completa, revisar status, contatos e movimentacoes."
            />
          ) : loadingDetail ? (
            <div className="space-y-4">
              <div className="animate-pulse rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="mt-4 h-8 w-48 rounded bg-white/10" />
                <div className="mt-4 h-4 w-full rounded bg-white/10" />
                <div className="mt-2 h-4 w-3/4 rounded bg-white/10" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`detail-skeleton-${index}`} className="animate-pulse rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="mt-5 h-6 w-24 rounded bg-white/10" />
                    <div className="mt-3 h-3 w-28 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          ) : selectedDetail ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.14),_transparent_24%),radial-gradient(circle_at_80%_18%,_rgba(53,194,255,0.12),_transparent_20%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={selectedDetail.profile.status === "active" ? "success" : selectedDetail.profile.status === "penalized" ? "warning" : "danger"}>
                        {selectedDetail.profile.status === "active"
                          ? "Ativo"
                          : selectedDetail.profile.status === "penalized"
                            ? "Penalizado"
                            : "Banido"}
                      </Badge>
                      {selectedDetail.profile.is_admin ? <Badge tone="info">Admin habilitado</Badge> : null}
                      {usingLocalFallback ? <Badge tone="muted">Dados locais</Badge> : null}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Ficha do usuario</div>
                      <h3 className="mt-2 font-display text-4xl font-black uppercase tracking-[-0.05em] text-white">
                        {selectedDetail.profile.gamertag || "Sem gamertag"}
                      </h3>
                      <p className="mt-2 text-sm text-white/68">{selectedDetail.profile.full_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {buildWhatsAppLink(selectedDetail.profile.whatsapp) ? (
                      <a
                        href={buildWhatsAppLink(selectedDetail.profile.whatsapp) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-emerald-100 transition hover:bg-emerald-500/18"
                      >
                        Abrir WhatsApp
                      </a>
                    ) : null}

                    <button
                      type="button"
                      className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/18"
                      onClick={() => setConfirmDeleteId(selectedDetail.profile.id)}
                    >
                      Excluir usuario
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <InfoTile label="Email" value={selectedDetail.profile.email || "Nao informado"} />
                  <InfoTile label="WhatsApp" value={selectedDetail.profile.whatsapp || "Nao informado"} />
                  <InfoTile label="CPF" value={selectedDetail.profile.cpf || "Nao informado"} />
                  <InfoTile label="Plataforma" value={selectedDetail.profile.platform || "Nao informado"} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard value={selectedDetail.wallet ? `${selectedDetail.wallet.balance} PPC` : "0 PPC"} label="Carteira atual" />
                <MetricCard
                  value={selectedDetail.metrics.registrations === null ? "--" : `${selectedDetail.metrics.registrations}`}
                  label="Inscricoes registradas"
                />
                <MetricCard
                  value={selectedDetail.metrics.purchases === null ? "--" : `${selectedDetail.metrics.purchases}`}
                  label="Compras de PPC"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-6">
                  <PanelSection
                    title="Controle da conta"
                    eyebrow="Status"
                    description="Ajuste rapidamente o status do usuario e registre o motivo visivel para operacao interna."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                          Status do usuario
                        </span>
                        <select
                          value={statusDraft}
                          onChange={(event) => setStatusDraft(event.target.value as UserRegistryStatus)}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-ppb-primary/50 focus:bg-white/[0.08]"
                        >
                          <option value="active">Ativo</option>
                          <option value="penalized">Penalizado</option>
                          <option value="banned">Banido</option>
                        </select>
                      </label>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Ultima atualizacao</div>
                        <div className="mt-3 text-sm text-white/82">{formatDateTime(selectedDetail.profile.updated_at)}</div>
                        <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Conta criada</div>
                        <div className="mt-3 text-sm text-white/82">{formatDateTime(selectedDetail.profile.created_at)}</div>
                      </div>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                        Motivo ou observacao
                      </span>
                      <textarea
                        value={reasonDraft}
                        onChange={(event) => setReasonDraft(event.target.value)}
                        placeholder="Explique aqui o motivo da restricao, contexto ou anotacao administrativa."
                        className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-ppb-primary/50 focus:bg-white/[0.08]"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="rounded-2xl border border-ppb-primary/40 bg-ppb-primary px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => void saveStatus()}
                        disabled={savingControl}
                      >
                        {savingControl ? "Salvando..." : "Salvar controle"}
                      </button>
                    </div>
                  </PanelSection>

                  <PanelSection
                    title="Sinais de duplicidade"
                    eyebrow="Risco"
                    description="Visao rapida para conferir repeticoes de CPF, email e gamertag em outras contas."
                  >
                    <div className="grid gap-3 md:grid-cols-3">
                      {(() => {
                        const risk = duplicateSnapshot(selectedDetail.profile, users);
                        return (
                          <>
                            <MiniRiskCard
                              label="CPF repetido"
                              value={`${risk.sameCpf}`}
                              tone={risk.sameCpf > 0 ? "danger" : "success"}
                            />
                            <MiniRiskCard
                              label="Email repetido"
                              value={`${risk.sameEmail}`}
                              tone={risk.sameEmail > 0 ? "danger" : "success"}
                            />
                            <MiniRiskCard
                              label="Gamertag repetido"
                              value={`${risk.sameGamertag}`}
                              tone={risk.sameGamertag > 0 ? "warning" : "success"}
                            />
                          </>
                        );
                      })()}
                    </div>
                  </PanelSection>

                  <PanelSection
                    title="Etiquetas CRM"
                    eyebrow="Segmentacao"
                    description="Ajuda a enxergar contexto comercial e operacional desse usuario dentro do funil."
                  >
                    {selectedDetail.labels.length === 0 ? (
                      <EmptyInline message="Nenhuma etiqueta vinculada a este usuario." />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedDetail.labels.map((label) => (
                          <span
                            key={label.id}
                            className="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]"
                            style={{
                              borderColor: `${label.color ?? "#35C2FF"}55`,
                              backgroundColor: `${label.color ?? "#35C2FF"}18`,
                              color: label.color ?? "#d8efff"
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </PanelSection>
                </div>

                <div className="space-y-6">
                  <PanelSection
                    title="Inscricoes recentes"
                    eyebrow="Campeonatos"
                    description="Ultimas entradas do jogador em campeonatos, plataforma usada e situacao de pagamento."
                  >
                    {selectedDetail.registrations.length === 0 ? (
                      <EmptyInline message="Nenhuma inscricao encontrada para este usuario." />
                    ) : (
                      <div className="space-y-3">
                        {selectedDetail.registrations.map((registration) => (
                          <TimelineCard
                            key={`${registration.tournament_id}-${registration.nickname}`}
                            title={slugToLabel(registration.tournament_id)}
                            meta={`${registration.platform} • ${formatDateTime(registration.created_at)}`}
                            chips={[
                              registration.payment_method || "sem metodo",
                              registration.payment_status || "sem status",
                              registration.team_name || "solo"
                            ]}
                          />
                        ))}
                      </div>
                    )}
                  </PanelSection>

                  <PanelSection
                    title="Compras de PPC"
                    eyebrow="Financeiro"
                    description="Pacotes comprados, volume de PPC e status recente da jornada de compra."
                  >
                    {selectedDetail.purchases.length === 0 ? (
                      <EmptyInline message="Nenhuma compra de PPC encontrada para este usuario." />
                    ) : (
                      <div className="space-y-3">
                        {selectedDetail.purchases.map((purchase) => (
                          <TimelineCard
                            key={purchase.id}
                            title={`${purchase.amount_ppc} PPC • ${formatMoney(purchase.amount_brl)}`}
                            meta={`${purchase.package_id} • ${formatDateTime(purchase.created_at)}`}
                            chips={[purchase.status]}
                          />
                        ))}
                      </div>
                    )}
                  </PanelSection>

                  <PanelSection
                    title="Saques recentes"
                    eyebrow="Carteira"
                    description="Pedidos de saida em PPC convertidos para Pix, com status operacional e observacoes."
                  >
                    {selectedDetail.withdrawals.length === 0 ? (
                      <EmptyInline message="Nenhum saque encontrado para este usuario." />
                    ) : (
                      <div className="space-y-3">
                        {selectedDetail.withdrawals.map((withdrawal) => (
                          <TimelineCard
                            key={withdrawal.id}
                            title={`${withdrawal.ppc_amount} PPC • ${formatMoney(withdrawal.brl_estimate)}`}
                            meta={`${withdrawal.status} • ${formatDateTime(withdrawal.created_at)}`}
                            chips={withdrawal.admin_note ? [withdrawal.admin_note] : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </PanelSection>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Nao foi possivel abrir os detalhes"
              description="A lista carregou, mas os dados completos desse usuario nao responderam agora. Tente selecionar novamente."
            />
          )}
        </section>
      </section>
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

function Badge({
  children,
  tone
}: {
  children: string;
  tone: "success" | "warning" | "danger" | "info" | "muted";
}) {
  const tones = {
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-300/25 bg-amber-400/10 text-amber-100",
    danger: "border-red-400/25 bg-red-500/10 text-red-100",
    info: "border-sky-300/25 bg-sky-400/10 text-sky-100",
    muted: "border-white/15 bg-white/[0.06] text-white/70"
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-3 text-sm text-white/82">{value}</div>
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

function MiniRiskCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger";
}) {
  const toneClasses = {
    success: "border-emerald-400/20 bg-emerald-500/8 text-emerald-100",
    warning: "border-amber-300/20 bg-amber-400/8 text-amber-100",
    danger: "border-red-400/20 bg-red-500/8 text-red-100"
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/54">{label}</div>
      <div className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em]">{value}</div>
    </div>
  );
}

function TimelineCard({
  title,
  meta,
  chips
}: {
  title: string;
  meta: string;
  chips?: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101722] p-4">
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/56">{meta}</div>
      {chips && chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={`${title}-${chip}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
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
    <div className="flex min-h-[420px] items-center justify-center rounded-[1.7rem] border border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
      <div className="max-w-lg">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/42">Painel de usuarios</div>
        <h3 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/58">{description}</p>
      </div>
    </div>
  );
}
