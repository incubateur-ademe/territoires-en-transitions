import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { FicheWithRelations, Financeur } from '@tet/domain/plans';
import { ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { BaseUpdateFicheModal } from '../../../components/base-update-fiche.modal';

type DeleteFinanceurButtonProps = {
  financeur: Financeur;
  onDelete: () => void;
  fiche: FicheWithRelations;
};

export const DeleteFinanceurButton = ({
  financeur,
  onDelete,
  fiche,
}: DeleteFinanceurButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="invisible group-hover:visible">
        <DeleteButton
          title="Supprimer le financeur"
          size="xs"
          onClick={() => setIsOpen(true)}
        />
      </div>
      {isOpen && (
        <BaseUpdateFicheModal
          fiche={fiche}
          title="Supprimer le financeur"
          subTitle={financeur.financeurTag.nom}
          openState={{ isOpen, setIsOpen }}
          render={({ descriptionId }) => (
            <div id={descriptionId}>
              <p className="mb-0">
                Ce financeur sera supprimé définitivement de l'action.
                Souhaitez-vous vraiment supprimer ce financeur ?
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
