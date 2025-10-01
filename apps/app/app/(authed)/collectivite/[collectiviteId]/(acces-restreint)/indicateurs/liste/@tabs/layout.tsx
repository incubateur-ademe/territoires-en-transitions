'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/Tabs/Tabs.next';
import { ReactNode } from 'react';
import { TabsListParams } from './tabs-list';

/**
 * Affiche les onglets ("Indicateurs clés", etc.)
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  // l'onglet "Mes indicateurs" est absent en mode visite
  const tabs = isReadOnly
    ? TabsListParams.filter(({ listId }) => listId !== 'mes-indicateurs')
    : TabsListParams;

  return (
    <Tabs className="grow flex flex-col">
      <TabsList className="!justify-start pl-0 mt-6 flex-nowrap">
        {tabs.map(({ listId, ...other }) => (
          <TabsTab
            key={listId}
            href={makeCollectiviteIndicateursListUrl({
              collectiviteId,
              listId,
            })}
            {...other}
          />
        ))}
      </TabsList>
      <TabsPanel className="grow flex flex-col">{children}</TabsPanel>
    </Tabs>
  );
}
