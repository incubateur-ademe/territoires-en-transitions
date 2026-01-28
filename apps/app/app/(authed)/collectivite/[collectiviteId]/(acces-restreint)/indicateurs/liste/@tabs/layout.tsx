'use client';

import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
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
  const { collectiviteId, hasCollectivitePermission } = useCurrentCollectivite();

  return (
    <Tabs className="grow flex flex-col">
      <TabsList className="!justify-start pl-0 mt-6 flex-nowrap">
        {TabsListParams.map(
          ({ listId, visibleWithPermission, ...other }) => {
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
          }
        )}
      </TabsList>
      <TabsPanel>{children}</TabsPanel>
    </Tabs>
  );
}
