import { FicheWithRelations } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { FicheShareEditorFormSection } from '../../../../share-fiche/fiche-share-editor.form-section';
import { FicheRestreintEditorFormSection } from './fiche-restreint-editor.form-section';

type AccessRightsManagementModalProps = {
  fiche: FicheWithRelations;
  onClose?: () => void;
  onUpdateAccess: (
    params: Pick<FicheWithRelations, 'restreint' | 'sharedWithCollectivites'>
  ) => void;
  isUpdatingAccess?: boolean;
};

export const AccessRightsManagementModal = ({
  fiche,
  onClose,
  onUpdateAccess,
  isUpdatingAccess = false,
}: AccessRightsManagementModalProps) => {
  const { sharedWithCollectivites, restreint } = fiche;

  const handleUpdateAccess = ({
    restreint,
    sharedWithCollectivites,
  }: Pick<FicheWithRelations, 'restreint' | 'sharedWithCollectivites'>) => {
    onUpdateAccess({ restreint, sharedWithCollectivites });
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
            disabled: isUpdatingAccess,
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
