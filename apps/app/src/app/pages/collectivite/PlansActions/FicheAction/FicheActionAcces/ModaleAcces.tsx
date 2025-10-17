import { FicheRestreintEditorFormSection } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheActionAcces/fiche-restreint-editor.form-section';
import FicheShareEditorFormSection from '@/app/plans/fiches/share-fiche/fiche-share-editor.form-section';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheWithRelations } from '@/domain/plans';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { useEffect, useState } from 'react';

type ModaleAccesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Pick<FicheWithRelations, 'titre' | 'restreint'> & FicheShareProperties;
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

  const resetForm = () => {
    setEditedRestreint(isRestreint);
    setEditedSharedCollectivites(sharedWithCollectivites ?? []);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

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
