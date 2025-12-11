import FicheShareEditorFormSection from '@/app/plans/fiches/share-fiche/fiche-share-editor.form-section';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { useCallback, useEffect, useState } from 'react';
import { FicheRestreintEditorFormSection } from './fiche-restreint-editor.form-section';

type ModaleAccesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheWithRelations;
  onUpdateAccess: (
    params: Pick<FicheWithRelations, 'restreint' | 'sharedWithCollectivites'>
  ) => void;
};

const ModaleAcces = ({
  isOpen,
  setIsOpen,
  fiche,
  onUpdateAccess,
}: ModaleAccesProps) => {
  const { titre, sharedWithCollectivites, restreint } = fiche;

  const isRestreint = restreint ?? false;
  const [editedRestreint, setEditedRestreint] = useState(isRestreint);
  const [editedSharedCollectivites, setEditedSharedCollectivites] = useState(
    sharedWithCollectivites ?? []
  );

  const resetForm = useCallback(() => {
    setEditedRestreint(isRestreint);
    setEditedSharedCollectivites(sharedWithCollectivites ?? []);
  }, [isRestreint, sharedWithCollectivites]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSave = () => {
    if (
      isRestreint !== editedRestreint ||
      JSON.stringify(sharedWithCollectivites) !==
        JSON.stringify(editedSharedCollectivites)
    ) {
      onUpdateAccess({
        restreint: editedRestreint,
        sharedWithCollectivites: editedSharedCollectivites,
      });
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Gestion des accès au niveau de la fiche action"
      subTitle={titre || ''}
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

export default ModaleAcces;
