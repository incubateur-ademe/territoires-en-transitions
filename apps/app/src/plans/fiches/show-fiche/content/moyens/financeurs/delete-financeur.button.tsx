import { FicheWithRelations } from '@tet/domain/plans';
import { Button, ModalFooterOKCancel, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
import { BaseUpdateFicheModal } from '../../../components/base-update-fiche.modal';

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
        title="Supprimer le financeur"
      />
      <VisibleWhen condition={isOpen}>
        <BaseUpdateFicheModal
          fiche={fiche}
          title="Supprimer le financeur"
          subTitle={financeurName}
          openState={{ isOpen, setIsOpen }}
          render={({ descriptionId }) => (
            <div id={descriptionId}>
              <p className="mb-0">
                Ce financeur sera supprimé définitivement de l&apos;action.
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
      </VisibleWhen>
    </>
  );
};
