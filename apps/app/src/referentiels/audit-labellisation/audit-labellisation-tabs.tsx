'use client';

import { appLabels } from '@/app/labels/catalog';
import { VisibleWhen } from '@tet/ui';
import { TabsTab } from '@tet/ui/design-system/TabsNext/index';
import { ReactElement } from 'react';
import { useGetAuditBadge } from './audit-badge-status/use-get-audit-badge';
import { useOptionalChecklist } from './checklist.context';

const AuditLabellisationTabsWithBadge = ({
  isConductingAudit,
}: {
  isConductingAudit: boolean;
}): ReactElement => {
  const auditBadge = useGetAuditBadge();

  return (
    <>
      <TabsTab
        href="audit-labellisation"
        label={appLabels.auditEtLabellisation}
        badge={auditBadge ?? undefined}
      />
      <VisibleWhen condition={isConductingAudit}>
        <TabsTab href="cycles" label={appLabels.cyclesEtComparaison} />
      </VisibleWhen>
    </>
  );
};

export const AuditLabellisationTabs = (): ReactElement => {
  const checklist = useOptionalChecklist();

  if (checklist === null || checklist.cycle.isError) {
    return (
      <TabsTab
        href="audit-labellisation"
        label={appLabels.auditEtLabellisation}
      />
    );
  }

  return (
    <AuditLabellisationTabsWithBadge
      isConductingAudit={checklist.cycle.isConductingAudit}
    />
  );
};
