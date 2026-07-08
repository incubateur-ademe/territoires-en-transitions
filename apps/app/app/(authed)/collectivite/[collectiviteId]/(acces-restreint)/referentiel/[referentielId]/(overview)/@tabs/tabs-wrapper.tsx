'use client';

import { useGetAuditBadge } from '@/app/referentiels/audit-labellisation/audit-badge-status/use-get-audit-badge';
import { useChecklist } from '@/app/referentiels/audit-labellisation/checklist.context';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isNewReferentiel as isNewReferentielUtil } from '@tet/domain/referentiels';
import { Spacer, VisibleWhen } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { PropsWithChildren } from 'react';

export const TabsWrapper = ({ children }: PropsWithChildren) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const auditBadge = useGetAuditBadge();
  const { cycle } = useChecklist();
  const showAuditConductTabs = cycle.isConductingAudit;

  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );
  const canReadDocuments = hasCollectivitePermission(
    'collectivites.documents.read'
  );

  const referentielId = useReferentielId();
  const isNewReferentiel = isNewReferentielUtil(referentielId);

  return (
    <Tabs className="grow flex flex-col" size="sm">
      <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
        <TabsTab href="progression" label="Mesures" />
        {!isNewReferentiel && <TabsTab href="synthese" label="Synthèse" />}
        <TabsTab href="evolutions" label="Évolutions du score" />
        {canReadComments && (
          <TabsTab href="commentaires" label="Commentaires" />
        )}
        {canReadDocuments && !isNewReferentiel && (
          <TabsTab href="documents" label="Documents" />
        )}
        <TabsTab href="historique" label="Journal d'activité" />
        <TabsTab
          href="audit-labellisation"
          label="Audit et labellisation"
          badge={auditBadge ?? undefined}
        />
        <VisibleWhen condition={showAuditConductTabs}>
          <TabsTab href="cycles" label="Cycles et comparaison" />
        </VisibleWhen>
      </TabsList>
      <Spacer height={1} />
      <TabsPanel>{children}</TabsPanel>
    </Tabs>
  );
};
