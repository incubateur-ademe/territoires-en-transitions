'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/TabsNext/index';
import { ReactNode } from 'react';
import { TabsListParams } from './tabs-list';

export default function Layout({ children }: { children: ReactNode }) {
  const { collectiviteId, permissions } = useCurrentCollectivite();

  return (
    <Tabs className="grow flex flex-col">
      <TabsList className="!justify-start pl-0 mt-6 flex-nowrap">
        {TabsListParams.map(
          ({ listId, isVisibleWithPermissions, ...other }) => {
            if (!isVisibleWithPermissions(permissions)) {
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
