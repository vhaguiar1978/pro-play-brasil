"use client";

import { useMemo, useState, type ReactNode } from "react";

type AdminWorkspaceProps = {
  overview: ReactNode;
  automation: ReactNode;
  tournaments: ReactNode;
  users: ReactNode;
  games: ReactNode;
  commerce: ReactNode;
  betting: ReactNode;
  ppc: ReactNode;
  withdrawals: ReactNode;
  complaints: ReactNode;
  crmLabels: ReactNode;
  cashRegister: ReactNode;
  whatsapp: ReactNode;
};

type AdminTabId =
  | "overview"
  | "automation"
  | "tournaments"
  | "users"
  | "games"
  | "commerce"
  | "betting"
  | "ppc"
  | "withdrawals"
  | "complaints"
  | "crmLabels"
  | "cashRegister"
  | "whatsapp";

export function AdminWorkspace(props: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");

  const tabs = useMemo(
    () => [
      { id: "overview" as const, label: "Dashboard", eyebrow: "Visão geral", content: props.overview },
      { id: "automation" as const, label: "Automáticos", eyebrow: "Agenda", content: props.automation },
      { id: "tournaments" as const, label: "Campeonatos", eyebrow: "Gestão", content: props.tournaments },
      { id: "users" as const, label: "Usuários", eyebrow: "Pessoas", content: props.users },
      { id: "games" as const, label: "Jogos", eyebrow: "Modalidades", content: props.games },
      { id: "commerce" as const, label: "Pagamentos", eyebrow: "Financeiro", content: props.commerce },
      { id: "betting" as const, label: "Anti-fraude", eyebrow: "Risco", content: props.betting },
      { id: "ppc" as const, label: "PPC", eyebrow: "Moeda", content: props.ppc },
      { id: "withdrawals" as const, label: "Saques", eyebrow: "Saídas", content: props.withdrawals },
      { id: "whatsapp" as const, label: "WhatsApp", eyebrow: "Mensagens", content: props.whatsapp },
      { id: "complaints" as const, label: "Suporte", eyebrow: "Reclamações", content: props.complaints },
      { id: "crmLabels" as const, label: "Etiquetas", eyebrow: "CRM", content: props.crmLabels },
      { id: "cashRegister" as const, label: "Caixa", eyebrow: "Financeiro", content: props.cashRegister }
    ],
    [props]
  );

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 text-white md:px-6 md:py-8">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.18),_transparent_28%),radial-gradient(circle_at_84%_20%,_rgba(53,194,255,0.12),_transparent_24%),linear-gradient(180deg,_#0b1018_0%,_#070b12_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary">
              Painel administrativo
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white md:text-5xl">
                Operação central do Pro Play Brasil
              </h1>
              <p className="max-w-2xl text-sm leading-8 text-white/70 md:text-base">
                O admin novo preserva leitura, produtividade e velocidade. Menos aparência genérica e mais sensação
                de cockpit de operação para campeonatos, pagamentos, usuários e suporte.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminHeroStat value={`${tabs.length}`} label="Módulos organizados" />
            <AdminHeroStat value="1 hub" label="Para rotina diária" />
            <AdminHeroStat value="Acesso" label="Financeiro, arena e CRM" />
            <AdminHeroStat value="Fluxo" label="Mais claro e mais rápido" />
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-[#0b1018] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = currentTab.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`min-w-[180px] shrink-0 rounded-2xl border px-4 py-3 text-left transition-all ${
                  active
                    ? "border-ppb-primary/60 bg-ppb-primary/14 shadow-ppb-glow"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <small className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/42">{tab.eyebrow}</small>
                <span className="mt-2 block text-sm font-black uppercase tracking-wider text-white">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-[#0b1018] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
              {currentTab.eyebrow}
            </div>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.03em] text-white">
              {currentTab.label}
            </h2>
          </div>
        </div>

        <div className="mt-5">{currentTab.content}</div>
      </section>
    </div>
  );
}

function AdminHeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="font-display text-3xl font-black uppercase text-white">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/46">{label}</div>
    </div>
  );
}
