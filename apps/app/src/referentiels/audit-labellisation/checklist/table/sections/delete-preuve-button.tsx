'use client';

import { appLabels } from '@/app/labels/catalog';
import { useRemovePreuveFromDemande } from '@/app/referentiels/labellisations/useRemovePreuveFromDemande';
import AlerteSuppression from '@/app/referentiels/preuves/Bibliotheque/AlerteSuppression';
import { PillButton } from '@tet/ui';
import { ReactElement, useState } from 'react';

export const DeletePreuveButton = ({
  preuveId,
}: {
  preuveId: number;
}): ReactElement => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { removePreuve } = useRemovePreuveFromDemande();

  return (
    <>
      <PillButton
        icon="delete-bin-line"
        onClick={() => setIsConfirmOpen(true)}
        iconPosition="right"
      >
        {appLabels.supprimer}
      </PillButton>
      <AlerteSuppression
        isOpen={isConfirmOpen}
        setIsOpen={setIsConfirmOpen}
        title={appLabels.supprimerDocument}
        message={appLabels.supprimerDocumentMessage}
        onDelete={() => {
          void removePreuve(preuveId);
        }}
      />
    </>
  );
};
