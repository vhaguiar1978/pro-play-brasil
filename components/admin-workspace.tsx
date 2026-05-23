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
  | "cashRegister";

export function AdminWorkspace(props: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");

  const tabs = useMemo(
    () => [
      { id: "overview" as const, label: "Dashboard", eyebrow: "Visao geral", content: props.overview },
      { id: "automation" as const, label: "Automaticos", eyebrow: "Agenda", content: props.automation },
      { id: "tournaments" as const, label: "Campeonatos", eyebrow: "Gestao", content: props.tournaments },
      { id: "users" as const, label: "Usuarios", eyebrow: "Pessoas", content: props.users },
      { id: "games" as const, label: "Jogos", eyebrow: "Modalidades", content: props.games },
      { id: "commerce" as const, label: "Pagamentos", eyebrow: "Financeiro", content: props.commerce },
      { id: "betting" as const, label: "Apostas", eyebrow: "Mercados", content: props.betting },
      { id: "ppc" as const, label: "PPC", eyebrow: "Moeda virtual", content: props.ppc },
      { id: "withdrawals" as const, label: "Saques", eyebrow: "Saidas", content: props.withdrawals },
      { id: "complaints" as const, label: "Suporte", eyebrow: "Reclamacoes", content: props.complaints },
      { id: "crmLabels" as const, label: "Etiquetas", eyebrow: "CRM", content: props.crmLabels },
      { id: "cashRegister" as const, label: "Caixa", eyebrow: "Financeiro", content: props.cashRegister }
    ],
    [props]
  );

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="page">
      <section className="admin-hero">
        <div className="admin-hero-copy">
          <span className="badge official">Painel administrativo</span>
          <h1>Controle operacional do Pro Play Brasil</h1>
          <p className="muted">
            Cada area agora fica separada por botoes no topo, com uma primeira pagina feita para acompanhar usuarios, PPC, pagamentos e alertas do sistema com mais clareza.
          </p>
        </div>
        <div className="admin-hero-meta">
          <div className="admin-hero-stat">
            <strong>12</strong>
            <span>modulos organizados</span>
          </div>
          <div className="admin-hero-stat">
            <strong>1 dashboard</strong>
            <span>para operacao diaria</span>
          </div>
        </div>
      </section>

      <section className="admin-tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab-button ${currentTab.id === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <small>{tab.eyebrow}</small>
            <span>{tab.label}</span>
          </button>
        ))}
      </section>

      <section className="admin-panel-stage">
        <div className="admin-panel-head">
          <div>
            <span className="badge">{currentTab.eyebrow}</span>
            <h2>{currentTab.label}</h2>
          </div>
        </div>

        <div className="admin-panel-body">{currentTab.content}</div>
      </section>
    </div>
  );
}
