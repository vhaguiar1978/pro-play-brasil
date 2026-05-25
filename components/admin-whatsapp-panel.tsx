"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import {
  buildWhatsAppUrl,
  formatWhatsAppDisplay,
  isLikelyWhatsApp,
  normalizeWhatsAppNumber
} from "@/lib/whatsapp";
import {
  getTemplate,
  renderTemplate,
  WHATSAPP_TEMPLATES,
  type WhatsAppTemplateId
} from "@/lib/whatsapp-templates";
import {
  readUserRegistry,
  type UserRegistryEntry
} from "@/lib/user-registry";
import { GAMES, getGameBySlug } from "@/lib/games";

type SourceId = "users" | "interested" | "custom";

type Contact = {
  id: string;
  nick: string;
  whatsapp: string;
  isPhone: boolean;
  /** Raw tag/contact se não for whatsapp */
  rawTag: string;
  /** Metadados extras */
  meta?: {
    gameSlug?: string;
    gameName?: string;
    source: string;
  };
};

type InterestData = {
  grouped: Record<
    string,
    Array<{ id: string; nick: string; tag: string; createdAt: string }>
  >;
};

const SOURCES: { id: SourceId; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: "users",
    label: "Usuários cadastrados",
    description: "Cadastros com WhatsApp na base. Ideal pra boas-vindas.",
    icon: Users
  },
  {
    id: "interested",
    label: "Interessados em jogos",
    description: "Quem clicou em \"Quero esse campeonato\" e deixou WhatsApp.",
    icon: Sparkles
  },
  {
    id: "custom",
    label: "Número avulso",
    description: "Mandar mensagem pra qualquer número. Sem precisar de cadastro.",
    icon: Phone
  }
];

type Props = {
  /** GET base pra interesses. Padrão: /api/admin/interest (auth real). */
  interestUrl?: string;
};

export function AdminWhatsAppPanel({ interestUrl = "/api/admin/interest" }: Props = {}) {
  const [source, setSource] = useState<SourceId>("users");
  const [templateId, setTemplateId] = useState<WhatsAppTemplateId>("welcome");
  const [bodyOverride, setBodyOverride] = useState<string>("");
  const [editingBody, setEditingBody] = useState(false);
  const [users, setUsers] = useState<UserRegistryEntry[]>([]);
  const [interest, setInterest] = useState<InterestData | null>(null);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [query, setQuery] = useState("");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [customPhone, setCustomPhone] = useState("");
  const [customNick, setCustomNick] = useState("");

  useEffect(() => {
    setUsers(readUserRegistry());
  }, []);

  const refetchInterest = useCallback(async () => {
    setLoadingInterest(true);
    try {
      const r = await fetch(interestUrl);
      const json = await r.json();
      setInterest({ grouped: json.grouped ?? {} });
    } catch {
      setInterest({ grouped: {} });
    } finally {
      setLoadingInterest(false);
    }
  }, [interestUrl]);

  useEffect(() => {
    if (source === "interested") refetchInterest();
  }, [source, refetchInterest]);

  const template = useMemo(() => getTemplate(templateId), [templateId]);

  // Quando muda template, atualiza body editável
  useEffect(() => {
    setBodyOverride(template.body);
    setEditingBody(false);
  }, [template]);

  const contacts: Contact[] = useMemo(() => {
    if (source === "users") {
      return users
        .filter((u) => isLikelyWhatsApp(u.whatsapp))
        .map((u) => ({
          id: u.id,
          nick: u.gamertag || u.fullName || "—",
          whatsapp: u.whatsapp,
          rawTag: u.whatsapp,
          isPhone: true,
          meta: { source: "Cadastro" }
        }));
    }
    if (source === "interested" && interest) {
      const list: Contact[] = [];
      for (const [slug, items] of Object.entries(interest.grouped)) {
        if (gameFilter !== "all" && slug !== gameFilter) continue;
        const gameName = getGameBySlug(slug)?.name ?? slug;
        for (const it of items) {
          list.push({
            id: it.id,
            nick: it.nick,
            whatsapp: it.tag,
            rawTag: it.tag,
            isPhone: isLikelyWhatsApp(it.tag),
            meta: { gameSlug: slug, gameName, source: "Interesse" }
          });
        }
      }
      return list;
    }
    return [];
  }, [source, users, interest, gameFilter]);

  const filteredContacts = useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.trim().toLowerCase();
    return contacts.filter(
      (c) => c.nick.toLowerCase().includes(q) || c.whatsapp.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  function renderMessage(contact?: Contact): string {
    return renderTemplate(
      { ...template, body: bodyOverride || template.body },
      {
        nick: contact?.nick,
        jogo: contact?.meta?.gameName,
        slug: contact?.meta?.gameSlug,
        campeonato: contact?.meta?.gameName,
        data: ""
      }
    );
  }

  function openWhatsApp(contact: Contact) {
    const phone = normalizeWhatsAppNumber(contact.whatsapp);
    const url = buildWhatsAppUrl(phone, renderMessage(contact));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openCustom() {
    const url = buildWhatsAppUrl(
      customPhone,
      renderMessage({ id: "custom", nick: customNick || "jogador", whatsapp: customPhone, rawTag: customPhone, isPhone: true })
    );
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text);
  }

  const usersWithWhatsApp = useMemo(
    () => users.filter((u) => isLikelyWhatsApp(u.whatsapp)).length,
    [users]
  );

  const interestedWithWhatsApp = useMemo(() => {
    if (!interest) return 0;
    return Object.values(interest.grouped)
      .flat()
      .filter((c) => isLikelyWhatsApp(c.tag)).length;
  }, [interest]);

  return (
    <div className="space-y-6 text-ppb-text">
      {/* HEADER */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-black uppercase text-ppb-text">
              WhatsApp — contato direto
            </h2>
            <p className="mt-1 text-sm text-ppb-muted">
              Sistema simples: escolha contato + template, clique e o WhatsApp Web abre com a mensagem pronta.
              <strong className="text-ppb-text"> Não envia automaticamente</strong> — você revisa e manda.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat icon={<Users className="h-4 w-4" />} label="Usuários com WhatsApp" value={usersWithWhatsApp} />
          <Stat icon={<Sparkles className="h-4 w-4" />} label="Interessados com WhatsApp" value={interestedWithWhatsApp} />
          <Stat icon={<MessageCircle className="h-4 w-4" />} label="Templates disponíveis" value={WHATSAPP_TEMPLATES.length} />
        </div>
      </div>

      {/* ESCOLHA DE FONTE */}
      <div className="grid gap-3 md:grid-cols-3">
        {SOURCES.map((s) => {
          const active = source === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-ppb-primary/60 bg-ppb-primary/15 shadow-ppb-glow"
                  : "border-ppb-border bg-ppb-surface hover:border-ppb-borderStrong"
              )}
            >
              {active ? (
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-ppb-primary/25 blur-2xl" />
              ) : null}
              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1",
                    active
                      ? "bg-ppb-primary text-white ring-ppb-primary/60"
                      : "bg-ppb-subtle text-ppb-primary ring-ppb-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-ppb-text">
                    {s.label}
                  </div>
                  <p className="mt-1 text-xs leading-snug text-ppb-muted">{s.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        {/* COLUNA ESQUERDA: CONTATOS / NÚMERO */}
        <div className="space-y-4">
          {source === "custom" ? (
            <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6">
              <h3 className="flex items-center gap-2 font-display text-base font-black uppercase text-ppb-text">
                <Phone className="h-4 w-4 text-emerald-300" />
                Número avulso
              </h3>
              <p className="mt-1 text-xs text-ppb-muted">
                Digite um número (com DDD) e abra o WhatsApp Web com a mensagem pronta.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    Nick / nome (opcional)
                  </label>
                  <input
                    type="text"
                    value={customNick}
                    onChange={(e) => setCustomNick(e.target.value)}
                    placeholder="ProGamer420"
                    className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1 w-full rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                  />
                  {customPhone && !isLikelyWhatsApp(customPhone) ? (
                    <p className="mt-1 text-[10px] text-rose-300">
                      Número parece inválido (precisa 10–13 dígitos)
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={openCustom}
                disabled={!isLikelyWhatsApp(customPhone)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* BUSCA + FILTRO DE JOGO */}
              <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por nick ou número"
                      className="w-full rounded-xl border border-ppb-border bg-ppb-subtle py-2 pl-9 pr-3 text-sm text-ppb-text placeholder:text-ppb-mutedSoft focus:border-ppb-primary focus:outline-none"
                    />
                  </div>
                  {source === "interested" ? (
                    <>
                      <select
                        value={gameFilter}
                        onChange={(e) => setGameFilter(e.target.value)}
                        className="rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2 text-xs font-bold uppercase tracking-wider text-ppb-text focus:border-ppb-primary focus:outline-none"
                      >
                        <option value="all">Todos os jogos</option>
                        {GAMES.map((g) => (
                          <option key={g.slug} value={g.slug}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={refetchInterest}
                        disabled={loadingInterest}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
                      >
                        <RefreshCw className={cn("h-3 w-3", loadingInterest && "animate-spin")} />
                        Atualizar
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* LISTA */}
              <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface">
                <div className="flex items-center justify-between border-b border-ppb-border px-5 py-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-ppb-mutedSoft">
                    {filteredContacts.length} contato{filteredContacts.length === 1 ? "" : "s"}
                  </div>
                  {source === "users" && users.length > 0 && usersWithWhatsApp === 0 ? (
                    <div className="text-[10px] text-amber-300">
                      <AlertCircle className="mr-1 inline h-3 w-3" />
                      Nenhum usuário com WhatsApp válido cadastrado
                    </div>
                  ) : null}
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="p-10 text-center">
                    <Users className="mx-auto h-8 w-8 text-ppb-mutedSoft" />
                    <p className="mt-3 text-sm text-ppb-muted">
                      {source === "users"
                        ? "Nenhum usuário com WhatsApp válido. Cadastros novos aparecem aqui."
                        : "Nenhum interessado com WhatsApp ainda. Use \"Número avulso\" pra contatos diretos."}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-ppb-border">
                    {filteredContacts.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-ppb-subtle/40"
                      >
                        <PlayerAvatar nick={c.nick} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-ppb-text">{c.nick}</div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                            {c.isPhone ? (
                              <span className="text-emerald-300">
                                <Phone className="mr-1 inline h-2.5 w-2.5" />
                                {formatWhatsAppDisplay(c.whatsapp)}
                              </span>
                            ) : (
                              <span className="text-amber-300">
                                <AlertCircle className="mr-1 inline h-2.5 w-2.5" />
                                Não é WhatsApp: {c.rawTag}
                              </span>
                            )}
                            {c.meta?.gameName ? (
                              <span className="rounded-full bg-ppb-primary/15 px-2 py-0.5 text-ppb-primary">
                                {c.meta.gameName}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {c.isPhone ? (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(c)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-[0_0_16px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Mandar
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.rawTag)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2 text-xs font-bold text-ppb-muted transition hover:border-ppb-primary/40 hover:text-ppb-text"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copiar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* COLUNA DIREITA: TEMPLATE + PREVIEW */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              Template
            </h3>
            <div className="mt-3 space-y-1">
              {WHATSAPP_TEMPLATES.map((t) => {
                const active = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      "block w-full rounded-xl px-3 py-2 text-left transition-colors",
                      active
                        ? "bg-ppb-primary/15 ring-1 ring-ppb-primary/40"
                        : "hover:bg-ppb-subtle"
                    )}
                  >
                    <div
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        active ? "text-ppb-text" : "text-ppb-muted"
                      )}
                    >
                      {t.label}
                    </div>
                    <div className="mt-0.5 text-[10px] leading-snug text-ppb-muted">
                      {t.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREVIEW */}
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Pré-visualização
              </h3>
              <button
                type="button"
                onClick={() => setEditingBody((v) => !v)}
                className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/25"
              >
                {editingBody ? "Salvar" : "Editar"}
              </button>
            </div>
            {editingBody ? (
              <textarea
                value={bodyOverride}
                onChange={(e) => setBodyOverride(e.target.value)}
                rows={10}
                className="mt-3 w-full rounded-xl border border-ppb-border bg-ppb-subtle p-3 text-xs text-ppb-text focus:border-emerald-400 focus:outline-none"
              />
            ) : (
              <div className="mt-3 whitespace-pre-wrap rounded-xl bg-ppb-background/60 p-3 text-xs leading-relaxed text-ppb-text/90">
                {bodyOverride || template.body || (
                  <span className="italic text-ppb-mutedSoft">
                    Mensagem vazia — escolha um template ou digite no modo edição.
                  </span>
                )}
              </div>
            )}
            {template.variables.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
                  Variáveis:
                </span>
                {template.variables.map((v) => (
                  <code
                    key={v}
                    className="rounded bg-ppb-subtle px-1.5 text-[10px] font-mono text-ppb-primary ring-1 ring-ppb-border"
                  >
                    {v}
                  </code>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-2 text-[10px] text-emerald-200/90 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                Ao clicar em <strong>Mandar</strong>, abre o WhatsApp Web em uma nova aba — você revisa antes de enviar.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface/60 p-3">
      <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-emerald-500/15 blur-2xl" />
      <div className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        <span className="text-emerald-300">{icon}</span>
        {label}
      </div>
      <div className="relative mt-1 font-display text-2xl font-black text-ppb-text">{value}</div>
    </div>
  );
}
