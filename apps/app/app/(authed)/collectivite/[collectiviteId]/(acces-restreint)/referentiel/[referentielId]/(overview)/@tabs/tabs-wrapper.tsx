'use client';

import { appLabels } from '@/app/labels/catalog';
import { AuditLabellisationTabs } from '@/app/referentiels/audit-labellisation/audit-labellisation-tabs';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isNewReferentiel } from '@tet/domain/referentiels';
import { Spacer } from '@tet/ui';
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
  const canReadDocuments = hasCollectivitePermission(
    'collectivites.documents.read'
  );

  const referentielId = useReferentielId();
  return (
    <Tabs className="grow flex flex-col" size="sm">
      <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
        <TabsTab
          href="progression"
          label={appLabels.referentielOngletMesures}
        />
        {!isNewReferentiel(referentielId) && (
          <TabsTab
            href="synthese"
            label={appLabels.referentielOngletSynthese}
          />
        )}
        <TabsTab
          href="evolutions"
          label={appLabels.referentielOngletEvolutions}
        />
        {canReadComments && (
          <TabsTab
            href="commentaires"
            label={appLabels.referentielOngletCommentaires}
          />
        )}
        {canReadDocuments && (
          <TabsTab
            href="documents"
            label={appLabels.referentielOngletDocuments}
          />
        )}
        <TabsTab
          href="historique"
          label={appLabels.referentielOngletHistorique}
        />
        <AuditLabellisationTabs />
      </TabsList>
      <Spacer height={1} />
      <TabsPanel>{children}</TabsPanel>
    </Tabs>
  );
};
