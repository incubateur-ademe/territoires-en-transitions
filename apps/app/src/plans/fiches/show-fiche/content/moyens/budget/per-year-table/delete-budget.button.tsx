import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { FicheWithRelations } from '@tet/domain/plans';
import { ModalFooterOKCancel } from '@tet/ui';
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
      <div className="invisible group-hover:visible">
        <DeleteButton
          title="Supprimer le budget"
          size="xs"
          onClick={() => setIsOpen(true)}
        />
      </div>
      {isOpen && (
        <BaseUpdateFicheModal
          fiche={fiche}
          title="Supprimer le budget"
          subTitle={`Budget ${year}`}
          openState={{ isOpen, setIsOpen }}
          render={({ descriptionId }) => (
            <div id={descriptionId}>
              <p className="mb-0">
                Ce budget sera supprimé définitivement de l&apos;action.
                Souhaitez-vous vraiment supprimer ce budget ?
              </p>
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
