import { appLabels } from '@/app/labels/catalog';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { FicheShareEditorFormSection } from '../../../../share-fiche/fiche-share-editor.form-section';
import { FicheRestreintEditorFormSection } from './fiche-restreint-editor.form-section';

type AccessRightsManagementModalProps = {
  fiche: FicheWithRelations;
  onClose: () => void;
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
  const isRestreint = restreint ?? false;

  const [editedRestreint, setEditedRestreint] = useState(isRestreint);
  const [editedSharedCollectivites, setEditedSharedCollectivites] = useState(
    sharedWithCollectivites ?? []
  );

  const hasChanges =
    isRestreint !== editedRestreint ||
    JSON.stringify(sharedWithCollectivites) !==
      JSON.stringify(editedSharedCollectivites);

  const handleSave = () => {
    if (hasChanges) {
      onUpdateAccess({
        restreint: editedRestreint,
        sharedWithCollectivites: editedSharedCollectivites,
      });
    }
    onClose();
  };

  return (
    <Modal
      openState={{ isOpen: true, setIsOpen: (open) => {
        if (!open) onClose();
       }}}
      size="lg"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.gererDroitsAcces}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FicheRestreintEditorFormSection
          restreint={editedRestreint}
          onChange={setEditedRestreint}
          className="!grid-cols-1 mb-4"
        />
        <FicheShareEditorFormSection
          collectivites={editedSharedCollectivites}
          onChange={setEditedSharedCollectivites}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok pending={isUpdatingAccess} onClick={handleSave}>
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
