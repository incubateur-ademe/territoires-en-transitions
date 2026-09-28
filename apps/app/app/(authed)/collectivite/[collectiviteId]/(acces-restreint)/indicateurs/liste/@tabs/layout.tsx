'use client';

import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
import { IndicateurVueTabActionsProvider } from '@/app/indicateurs/vues/indicateur-vue-tab-actions.context';
import { IndicateurVuesTabs } from '@/app/indicateurs/vues/indicateur-vues.tabs';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
    Tabs,
    TabsList,
    TabsPanel,
    TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { ReactNode } from 'react';
import { TabsListParams } from './tabs-list';

export default function Layout({ children }: { children: ReactNode }) {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  return (
    <IndicateurVueTabActionsProvider>
      <Tabs className="grow flex flex-col">
        <TabsList className="!justify-start pl-0 flex-nowrap overflow-x-auto mb-4">
          {TabsListParams.map(({ listId, visibleWithPermission, ...other }) => {
            if (!hasCollectivitePermission(visibleWithPermission)) {
              return null;
            }

            return (
              <TabsTab
                key={listId}
                href={makeCollectiviteIndicateursListUrl({
                  collectiviteId,
                  listId,
                })}
                {...other}
              />
            );
          })}
          <IndicateurVuesTabs />
        </TabsList>
        <TabsPanel>{children}</TabsPanel>
      </Tabs>
    </IndicateurVueTabActionsProvider>
  );
}
