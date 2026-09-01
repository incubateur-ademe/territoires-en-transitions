'use client';

import { CloturerAuditButton } from '@/app/referentiels/audits/cloture/cloturer-audit.button';
import { AskPremiereEtoileModal } from '@/app/referentiels/labellisations/ask-premiere-etoile/ask-premiere-etoile.modal';
import { RequestAuditButton } from '@/app/referentiels/labellisations/request-audit/request-audit.button';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { VisibleWhen } from '@tet/ui';
import { ReactElement, useState } from 'react';
import { useChecklist } from '../checklist.context';
import { getAskPremiereEtoileButtonState } from './actions/ask-premiere-etoile-button-state';
import { AskPremiereEtoileButton } from './actions/ask-premiere-etoile.button';
import { StartAuditButton } from './actions/start-audit.button';

const CollectiviteActions = (): ReactElement => {
  const { collectiviteId } = useCurrentCollectivite();
  const { cycle, referentielId, premiereEtoileObtenue } = useChecklist();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <VisibleWhen condition={!premiereEtoileObtenue}>
        <AskPremiereEtoileButton
          state={getAskPremiereEtoileButtonState({
            canAskFirstStar: cycle.canAskFirstStar,
            parcours: cycle.parcours,
          })}
          onClick={() => setIsOpen(true)}
        />
        <AskPremiereEtoileModal
          isCOT={cycle.isCOT}
          collectiviteId={collectiviteId}
          referentiel={referentielId}
          status={cycle.status}
          opened={isOpen}
          setOpened={setIsOpen}
        />
      </VisibleWhen>
      <RequestAuditButton referentielId={referentielId} />
    </>
  );
};

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
        <CloturerAuditButton
          auditId={auditEnCours.id}
          demandeId={auditEnCours.demande_id}
          size="xs"
        />
      )}
    </>
  );
};

export const ChecklistActions = (): ReactElement => {
  const { cycle } = useChecklist();
  return (
    <>
      <VisibleWhen condition={cycle.viewerRole === 'auditee'}>
        <CollectiviteActions />
      </VisibleWhen>
      <AuditeurActions />
    </>
  );
};
