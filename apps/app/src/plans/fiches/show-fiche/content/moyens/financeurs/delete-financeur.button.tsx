import { appLabels } from '@/app/labels/catalog';
import { UpdateFicheAlertModalBody } from '@/app/plans/fiches/components/update-fiche-modal-body';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button } from '@tet/ui';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { useState } from 'react';

type DeleteFinanceurButtonProps = {
  financeurName: string;
  onDelete: () => void;
  fiche: FicheWithRelations;
};

export const DeleteFinanceurButton = ({
  financeurName,
  onDelete,
  fiche,
}: DeleteFinanceurButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        icon="delete-bin-line"
        variant="white"
        size="xs"
        className="text-grey-6"
        onClick={() => setIsOpen(true)}
        title={appLabels.supprimerFinanceur}
        aria-label={appLabels.supprimerFinanceur}
      />
      <AlertModal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }}>
        <AlertModal.Header>
          <AlertModal.Title>{appLabels.supprimerFinanceur}</AlertModal.Title>
          <AlertModal.Subtitle>{financeurName}</AlertModal.Subtitle>
        </AlertModal.Header>
        <UpdateFicheAlertModalBody fiche={fiche}>
          <AlertModal.Description>
            {appLabels.supprimerFinanceurDescription}
          </AlertModal.Description>
        </UpdateFicheAlertModalBody>
        <AlertModal.Footer>
          <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
          <AlertModal.Action onClick={onDelete}>
            {appLabels.valider}
          </AlertModal.Action>
        </AlertModal.Footer>
      </AlertModal>
    </>
  );
};
