'use client';

import { DemandeLabellisationModal } from '@/app/referentiels/labellisations/DemandeLabellisationModal';
import { StartAuditButton } from '@/app/referentiels/labellisations/start-audit/start-audit.button';
import { ReactElement, useState } from 'react';
import { useChecklist } from '../checklist.context';
import { getAskPremiereEtoileButtonState } from './actions/ask-premiere-etoile-button-state';
import { AskPremiereEtoileButton } from './actions/ask-premiere-etoile.button';

export const ChecklistActions = (): ReactElement => {
  const { cycle, referentielId } = useChecklist();
  const { canAskFirstStar, isCOT, parcours } = cycle;
  const [isOpen, setIsOpen] = useState(false);
  const askPremiereEtoileState = getAskPremiereEtoileButtonState({
    canAskFirstStar,
    parcours,
  });

  return (
    <>
      <AskPremiereEtoileButton
        state={askPremiereEtoileState}
        onClick={() => setIsOpen(true)}
      />
      <StartAuditButton referentielId={referentielId} />
      <DemandeLabellisationModal
        parcoursLabellisation={cycle}
        isCOT={isCOT}
        opened={isOpen}
        setOpened={setIsOpen}
      />
    </>
  );
};
