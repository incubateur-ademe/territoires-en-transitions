'use client';

import { useAuditStatusBadge } from '@/app/referentiels/audit-labellisation/audit-badge/use-audit-status-badge';
import { useChecklist } from '@/app/referentiels/audit-labellisation/checklist.context';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { Spacer } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { PropsWithChildren } from 'react';

export const TabsWrapper = ({ children }: PropsWithChildren) => {
  const isVisitor = useIsVisitor();
  const auditBadge = useAuditStatusBadge();
  const { cycle } = useChecklist();
  const showAuditConductTabs = cycle.isConductingAudit;

  return (
    <Tabs className="grow flex flex-col" size="sm">
      <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
        <TabsTab href="progression" label="Mesures" />
        <TabsTab href="priorisation" label="Aide à la priorisation" />
        <TabsTab href="detail" label="Détail des statuts" />
        <TabsTab href="evolutions" label="Évolutions du score" />
        {!isVisitor && <TabsTab href="commentaires" label="Commentaires" />}
        <TabsTab
          href="audit-labellisation"
          label="Audit et labellisation"
          badge={auditBadge ?? undefined}
        />
        {showAuditConductTabs && (
          <>
            <TabsTab href="suivi" label="Suivi de l'audit" />
            <TabsTab href="cycles" label="Cycles et comparaison" />
          </>
        )}
      </TabsList>
      <Spacer height={1} />
      <TabsPanel>{children}</TabsPanel>
    </Tabs>
  );
};
