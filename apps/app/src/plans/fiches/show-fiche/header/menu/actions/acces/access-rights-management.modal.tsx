import { FicheResume, FicheWithRelations } from '@/domain/plans';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { useState } from 'react';
import { useUpdateFiche } from '../../../../../update-fiche/data/use-update-fiche';
import { FicheShareEditorFormSection } from '../../../../share-fiche/fiche-share-editor.form-section';
import { FicheRestreintEditorFormSection } from './fiche-restreint-editor.form-section';

type AccessRightsManagementModalProps = {
  fiche: FicheResume;
  onClose?: () => void;
};

export const AccessRightsManagementModal = ({
  fiche,
  onClose,
}: AccessRightsManagementModalProps) => {
  const { sharedWithCollectivites, restreint } = fiche;
  const { mutate: updateFiche, isPending: isEditLoading } = useUpdateFiche();

  const handleUpdateAccess = ({
    restreint,
    sharedWithCollectivites,
  }: Pick<FicheWithRelations, 'restreint' | 'sharedWithCollectivites'>) => {
    updateFiche({
      ficheId: fiche.id,
      ficheFields: { restreint, sharedWithCollectivites },
    });
  };

  const isRestreint = restreint ?? false;
  const [editedRestreint, setEditedRestreint] = useState(isRestreint);
  const [editedSharedCollectivites, setEditedSharedCollectivites] = useState(
    sharedWithCollectivites ?? []
  );

  const handleSave = () => {
    if (
      isRestreint !== editedRestreint ||
      JSON.stringify(sharedWithCollectivites) !==
        JSON.stringify(editedSharedCollectivites)
    ) {
      handleUpdateAccess({
        restreint: editedRestreint,
        sharedWithCollectivites: editedSharedCollectivites,
      });
    }
  };

  return (
    <Modal
      openState={{ isOpen: true, setIsOpen: () => {} }}
      onClose={onClose}
      title="Gérer les droits d'accès de l'action"
      size="lg"
      render={() => (
        <>
          <FicheRestreintEditorFormSection
            restreint={editedRestreint}
            onChange={setEditedRestreint}
            className="!grid-cols-1 mb-4"
          />

          <FicheShareEditorFormSection
            collectivites={editedSharedCollectivites}
            onChange={setEditedSharedCollectivites}
          />
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            disabled: isEditLoading,
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};
