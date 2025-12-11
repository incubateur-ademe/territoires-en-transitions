import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { Field, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useEffect, useState } from 'react';

type ModaleFichesLieesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  currentFicheId: number | null;
  linkedFicheIds: number[];
  updateLinkedFicheIds: (ficheIds: number[]) => void;
};

export const ModaleFichesLiees = ({
  isOpen,
  setIsOpen,
  currentFicheId,
  linkedFicheIds,
  updateLinkedFicheIds,
}: ModaleFichesLieesProps) => {
  const [linkedFicheIdsState, setLinkedFicheIdsState] =
    useState<number[]>(linkedFicheIds);

  useEffect(() => {
    setLinkedFicheIdsState(linkedFicheIds);
  }, [linkedFicheIds]);

  const handleSave = () => {
    updateLinkedFicheIds(linkedFicheIdsState);
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Lier une fiche action"
      size="lg"
      render={({ descriptionId }) => (
        <Field fieldId={descriptionId} title="Fiches action">
          <FichesActionsDropdown
            ficheCouranteId={currentFicheId}
            values={linkedFicheIdsState.map((id) => id.toString())}
            onChange={({ fiches }) =>
              setLinkedFicheIdsState(fiches.map((f) => f.id))
            }
          />
        </Field>
      )}
      // Boutons pour valider / annuler les modifications
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
