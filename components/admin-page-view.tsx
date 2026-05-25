import { AdminOverviewPanel } from "@/components/admin-overview-panel";
import { AdminWorkspace } from "@/components/admin-workspace";
import { AdminBettingPanel } from "@/components/admin-betting-panel";
import { AdminCashRegisterPanel } from "@/components/admin-cash-register-panel";
import { AdminComplaintsPanel } from "@/components/admin-complaints-panel";
import { AdminCommercePanel } from "@/components/admin-commerce-panel";
import { AdminCrmLabelsPanel } from "@/components/admin-crm-labels-panel";
import { AdminGameHubsPanel } from "@/components/admin-game-hubs-panel";
import { AdminGamesImagesPanel } from "@/components/admin-games-images-panel";
import { AdminGamesEditorPanel } from "@/components/admin-games-editor-panel";
import { AdminInterestPanel } from "@/components/admin-interest-panel";
import { AdminPlayerBadgesPanel } from "@/components/admin-player-badges-panel";
import { AdminWhatsAppPanel } from "@/components/admin-whatsapp-panel";
import { AdminPpcPanel } from "@/components/admin-ppc-panel";
import { AdminTournamentAutomationPanel } from "@/components/admin-tournament-automation-panel";
import { AdminTournamentsPanel } from "@/components/admin-tournaments-panel";
import { AdminTournamentsEditorPanel } from "@/components/admin-tournaments-editor-panel";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { AdminWithdrawalsPanel } from "@/components/admin-withdrawals-panel";

export function AdminPageView() {
  return (
    <AdminWorkspace
      overview={<AdminOverviewPanel />}
      automation={<AdminTournamentAutomationPanel />}
      tournaments={
        <div className="space-y-8">
          <AdminTournamentsEditorPanel />
          <AdminTournamentsPanel />
        </div>
      }
      users={
        <div className="space-y-8">
          <AdminPlayerBadgesPanel />
          <AdminUsersPanel />
        </div>
      }
      games={
        <div className="space-y-8">
          <AdminGamesEditorPanel />
          <AdminInterestPanel
            fetchUrl="/api/admin/interest"
            statusBaseUrl="/api/admin/games"
          />
          <AdminGamesImagesPanel />
          <AdminGameHubsPanel />
        </div>
      }
      commerce={<AdminCommercePanel />}
      betting={<AdminBettingPanel />}
      ppc={<AdminPpcPanel />}
      withdrawals={<AdminWithdrawalsPanel />}
      complaints={<AdminComplaintsPanel />}
      crmLabels={<AdminCrmLabelsPanel />}
      cashRegister={<AdminCashRegisterPanel />}
      whatsapp={<AdminWhatsAppPanel interestUrl="/api/admin/interest" />}
    />
  );
}
