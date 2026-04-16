import { appLabels } from '@/app/labels/catalog';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { BaseUpdateFicheModal } from '../../../../components/base-update-fiche.modal';

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
      {isOpen && (
        <BaseUpdateFicheModal
          fiche={fiche}
          title={appLabels.supprimerBudget}
          subTitle={appLabels.budgetAnnee({ year })}
          openState={{ isOpen, setIsOpen }}
          render={({ descriptionId }) => (
            <div id={descriptionId}>
              <p className="mb-0">{appLabels.supprimerBudgetDescription}</p>
            </div>
          )}
          renderFooter={({ close }) => (
            <ModalFooterOKCancel
              btnCancelProps={{ onClick: close }}
              btnOKProps={{
                onClick: () => {
                  onDelete();
                  close();
                },
              }}
            />
          )}
        />
      )}
    </>
  );
};
