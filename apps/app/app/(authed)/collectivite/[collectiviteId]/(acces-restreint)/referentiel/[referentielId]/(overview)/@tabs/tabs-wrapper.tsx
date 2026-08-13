'use client';

import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useReferentielViewMode } from '@/app/referentiels/referentiel.table/use-referentiel-view-mode';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isNewReferentiel as isNewReferentielUtils } from '@tet/domain/referentiels';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { PropsWithChildren } from 'react';

export const TabsWrapper = ({ children }: PropsWithChildren) => {
  const referentielId = useReferentielId();
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );
  const canReadDocuments = hasCollectivitePermission(
    'collectivites.documents.read'
  );

  const { mode } = useReferentielViewMode();
  const isTableView = mode === 'table';
  const isNewReferentiel = isNewReferentielUtils(referentielId);

  return (
    <Tabs className="grow flex flex-col">
      <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
        <TabsTab href="progression" label="Mesures" />
        {!isNewReferentiel && <TabsTab href="synthese" label="Synthèse" />}
        {!isNewReferentiel && !isTableView && (
          <>
            <TabsTab href="priorisation" label="Aide à la priorisation" />
            <TabsTab href="detail" label="Détail des statuts" />
          </>
        )}
        <TabsTab href="evolutions" label="Évolutions du score" />

        {canReadComments && (
          <TabsTab href="commentaires" label="Commentaires" />
        )}
        {canReadDocuments && !isNewReferentiel && (
          <TabsTab href="documents" label="Documents" />
        )}
        <TabsTab href="historique" label="Journal d'activité" />
      </TabsList>

      <TabsPanel className="mt-4">{children}</TabsPanel>
    </Tabs>
  );
};
