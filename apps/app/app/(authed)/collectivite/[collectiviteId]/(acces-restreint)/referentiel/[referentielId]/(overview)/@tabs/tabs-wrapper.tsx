'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { PropsWithChildren } from 'react';

export const TabsWrapper = ({ children }: PropsWithChildren) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  return (
    <Tabs className="grow flex flex-col">
      <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
        <TabsTab href="progression" label="Mesures" />
        <TabsTab href="mesures-beta" label="Mesures (beta)" />
        <TabsTab href="priorisation" label="Aide à la priorisation" />
        <TabsTab href="detail" label="Détail des statuts" />
        <TabsTab href="evolutions" label="Évolutions du score" />

        {canReadComments && (
          <TabsTab href="commentaires" label="Commentaires" />
        )}
      </TabsList>

      <TabsPanel className="mt-8">{children}</TabsPanel>
    </Tabs>
  );
};
