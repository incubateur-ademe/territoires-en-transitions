'use client';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlanSuiviUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  TabsList,
  TabsPanel,
  TabsTab,
  Tabs as TabsUI,
} from '@tet/ui/design-system/TabsNext/index';
import { ReactNode } from 'react';

export type PlanTab = 'pilotage' | 'suivi';

export const PlanTabs = ({
  collectiviteId,
  planId,
  activeTab,
  children,
}: {
  collectiviteId: number;
  planId: number;
  activeTab: PlanTab;
  children: ReactNode;
}) => {
  const planActionUid = planId.toString();
  return (
    <TabsUI>
      <TabsList className="flex justify-start gap-2 m-0 p-0">
        <TabsTab
          label={appLabels.planOngletPilotage}
          href={makeCollectivitePlanActionUrl({
            collectiviteId,
            planActionUid,
          })}
          isActive={activeTab === 'pilotage'}
          dataTest="plans.plan.onglet-pilotage"
        />
        <TabsTab
          label={appLabels.planOngletSuivi}
          href={makeCollectivitePlanSuiviUrl({ collectiviteId, planActionUid })}
          isActive={activeTab === 'suivi'}
          dataTest="plans.plan.onglet-suivi"
        />
      </TabsList>
      <TabsPanel className="mt-6 border-none rounded-none">
        {children}
      </TabsPanel>
    </TabsUI>
  );
};
