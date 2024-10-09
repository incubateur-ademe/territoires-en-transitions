import { Field, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useEffect, useState } from 'react';
import FichesActionsDropdown from 'ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';

type ModaleFichesLieesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  currentFicheId: number;
  linkedFicheIds: number[];
  updateLinkedFicheIds: (ficheIds: number[]) => void;
};

const ModaleFichesLiees = ({
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
        <Field fieldId={descriptionId} title="Fiches des plans liées">
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

export default ModaleFichesLiees;
