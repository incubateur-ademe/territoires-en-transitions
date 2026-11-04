'use client';

import { CloturerAuditButton } from '@/app/referentiels/audits/cloture/cloturer-audit.button';
import { VisibleWhen } from '@tet/ui';
import { ReactElement } from 'react';
import { useChecklist } from '../checklist.context';
import { SendDemandeButton } from './actions/send-demande.button';
import { StartAuditButton } from './actions/start-audit.button';

const AuditeurActions = (): ReactElement => {
  const { cycle } = useChecklist();

  const auditEnCours = cycle.isConductingAudit
    ? cycle.parcours?.audit ?? null
    : null;

  const auditADemarrer =
    cycle.canStartAudit && cycle.parcours?.audit ? cycle.parcours.audit : null;

  return (
    <>
      {auditADemarrer && <StartAuditButton auditId={auditADemarrer.id} />}
      {auditEnCours && (
        <CloturerAuditButton auditId={auditEnCours.id} size="xs" />
      )}
    </>
  );
};

export const ChecklistActions = (): ReactElement => {
  const { cycle } = useChecklist();
  return (
    <>
      <VisibleWhen condition={cycle.viewerRole === 'auditee'}>
        <SendDemandeButton />
      </VisibleWhen>
      <AuditeurActions />
    </>
  );
};
