import { AdminOverviewPanel } from "@/components/admin-overview-panel";
import { AdminWorkspace } from "@/components/admin-workspace";
import { AdminBettingPanel } from "@/components/admin-betting-panel";
import { AdminCashRegisterPanel } from "@/components/admin-cash-register-panel";
import { AdminComplaintsPanel } from "@/components/admin-complaints-panel";
import { AdminCommercePanel } from "@/components/admin-commerce-panel";
import { AdminCrmLabelsPanel } from "@/components/admin-crm-labels-panel";
import { AdminGameHubsPanel } from "@/components/admin-game-hubs-panel";
import { AdminPpcPanel } from "@/components/admin-ppc-panel";
import { AdminTournamentAutomationPanel } from "@/components/admin-tournament-automation-panel";
import { AdminTournamentsPanel } from "@/components/admin-tournaments-panel";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { AdminWithdrawalsPanel } from "@/components/admin-withdrawals-panel";

export function AdminPageView() {
  return (
    <AdminWorkspace
      overview={<AdminOverviewPanel />}
      automation={<AdminTournamentAutomationPanel />}
      tournaments={<AdminTournamentsPanel />}
      users={<AdminUsersPanel />}
      games={<AdminGameHubsPanel />}
      commerce={<AdminCommercePanel />}
      betting={<AdminBettingPanel />}
      ppc={<AdminPpcPanel />}
      withdrawals={<AdminWithdrawalsPanel />}
      complaints={<AdminComplaintsPanel />}
      crmLabels={<AdminCrmLabelsPanel />}
      cashRegister={<AdminCashRegisterPanel />}
    />
  );
}
