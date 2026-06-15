'use client';

import { CloturerAuditButton } from '@/app/referentiels/audits/cloture/cloturer-audit.button';
import { DemandeLabellisationModal } from '@/app/referentiels/labellisations/DemandeLabellisationModal';
import { StartAuditButton } from '@/app/referentiels/labellisations/start-audit/start-audit.button';
import { VisibleWhen } from '@tet/ui';
import { ReactElement, useState } from 'react';
import { useChecklist } from '../checklist.context';
import { getAskPremiereEtoileButtonState } from './actions/ask-premiere-etoile-button-state';
import { AskPremiereEtoileButton } from './actions/ask-premiere-etoile.button';
import { BeginAuditButton } from './actions/begin-audit.button';

const CollectiviteActions = (): ReactElement => {
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
        <DemandeLabellisationModal
          parcoursLabellisation={cycle}
          isCOT={cycle.isCOT}
          opened={isOpen}
          setOpened={setIsOpen}
        />
      </VisibleWhen>
      <StartAuditButton referentielId={referentielId} />
    </>
  );
};

export const ChecklistActions = (): ReactElement => {
  const { cycle } = useChecklist();

  const auditEnCours = cycle.isConductingAudit
    ? cycle.parcours?.audit ?? null
    : null;

  const auditADemarrer =
    cycle.peutCommencerAudit && cycle.parcours?.audit
      ? cycle.parcours.audit
      : null;

  return (
    <>
      <VisibleWhen condition={cycle.viewerRole === 'auditee'}>
        <CollectiviteActions />
      </VisibleWhen>
      {auditADemarrer && <BeginAuditButton auditId={auditADemarrer.id} />}
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
