import { appLabels } from '@/app/labels/catalog';
import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { Field, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';

type ModaleFichesLieesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  currentFicheId: number | null;
  linkedFicheIds: number[];
  updateLinkedFicheIds: (ficheIds: number[]) => void;
};

export const FichesLieesModal = ({
  isOpen,
  setIsOpen,
  currentFicheId,
  linkedFicheIds,
  updateLinkedFicheIds,
}: ModaleFichesLieesProps) => {
  const [linkedFicheIdsState, setLinkedFicheIdsState] =
    useState<number[]>(linkedFicheIds);

  /**
   * Repart des actions liées à chaque ouverture. Un effet les recopiait dès que
   * la prop changeait d'identité — or le parent la reconstruit à chaque rendu,
   * si bien qu'une sélection en cours était écrasée dès qu'il se rafraîchissait.
   */
  const [etaitOuverte, setEtaitOuverte] = useState(isOpen);
  if (etaitOuverte !== isOpen) {
    setEtaitOuverte(isOpen);
    if (isOpen) {
      setLinkedFicheIdsState(linkedFicheIds);
    }
  }

  const handleSave = () => {
    updateLinkedFicheIds(linkedFicheIdsState);
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title={appLabels.lierAction}
      size="lg"
      render={() => (
        <Field title={appLabels.actions}>
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

