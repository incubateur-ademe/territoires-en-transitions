import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { FicheWithRelations } from '@/domain/plans';
import { ModalFooterOKCancel, RichTextEditor } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';

type ResourcesModalProps = {
  openState: OpenState;
  fiche: FicheWithRelations;
  updateResources: (resources: string | null | undefined) => void;
};

export const ResourcesModal = ({
  openState,
  fiche,
  updateResources,
}: ResourcesModalProps) => {
  const [previousResources, setPreviousResources] = useState<string | null>(
    fiche.ressources ?? null
  );

  const [editedResources, setEditedResources] = useState<string | null>(
    fiche.ressources ?? null
  );

  if (previousResources !== fiche.ressources) {
    setPreviousResources(fiche.ressources ?? null);
    setEditedResources(fiche.ressources ?? null);
  }

  const handleSave = async () => {
    if (previousResources !== editedResources) {
      try {
        await updateResources(editedResources);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={openState}
      title="Moyens humains et techniques"
      size="lg"
      render={() => (
        <RichTextEditor
          initialValue={fiche.ressources ?? undefined}
          onChange={(value) => setEditedResources(value?.trim() ? value : null)}
        />
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: async () => {
              if (await handleSave()) {
                close();
              }
            },
          }}
        />
      )}
    />
  );
};
