'use client';

import { useReferentielViewMode } from '@/app/referentiels/referentiel.table/use-referentiel-view-mode';
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

  const { mode } = useReferentielViewMode();
  const isTableView = mode === 'table';

  return (
    <Tabs className="grow flex flex-col">
      <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
        <TabsTab href="progression" label="Mesures" />
        {!isTableView && (
          <>
            <TabsTab href="priorisation" label="Aide à la priorisation" />
            <TabsTab href="detail" label="Détail des statuts" />
          </>
        )}
        <TabsTab href="evolutions" label="Évolutions du score" />

        {canReadComments && (
          <TabsTab href="commentaires" label="Commentaires" />
        )}
      </TabsList>

      <TabsPanel className="mt-4">{children}</TabsPanel>
    </Tabs>
  );
};
