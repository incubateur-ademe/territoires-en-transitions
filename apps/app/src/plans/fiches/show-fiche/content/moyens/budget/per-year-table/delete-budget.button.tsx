import { appLabels } from '@/app/labels/catalog';
import { UpdateFicheAlertModalBody } from '@/app/plans/fiches/components/update-fiche-modal-body';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button } from '@tet/ui';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { useState } from 'react';

type DeleteBudgetButtonProps = {
  year: number | null;
  onDelete: () => void;
  fiche: FicheWithRelations;
};

export const DeleteBudgetButton = ({
  year,
  onDelete,
  fiche,
}: DeleteBudgetButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!year) return null;

  return (
    <>
      <Button
        icon="delete-bin-line"
        size="xs"
        variant="white"
        className="text-grey-6"
        onClick={() => setIsOpen(true)}
        title={appLabels.supprimerBudget}
      />
      <AlertModal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }}>
        <AlertModal.Header>
          <AlertModal.Title>{appLabels.supprimerBudget}</AlertModal.Title>
          <AlertModal.Subtitle>
            {appLabels.budgetAnnee({ year })}
          </AlertModal.Subtitle>
        </AlertModal.Header>
        <UpdateFicheAlertModalBody fiche={fiche}>
          <AlertModal.Description>
            {appLabels.supprimerBudgetDescription}
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
