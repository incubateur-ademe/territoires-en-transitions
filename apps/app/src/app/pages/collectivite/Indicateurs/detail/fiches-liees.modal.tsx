import { appLabels } from '@/app/labels/catalog';
import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { Field } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    setLinkedFicheIdsState(linkedFicheIds);
  }, [linkedFicheIds]);

  return (
    <Modal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }} size="lg">
      <Modal.Header>
        <Modal.Title>{appLabels.lierAction}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Field title={appLabels.actions}>
          <FichesActionsDropdown
            ficheCouranteId={currentFicheId}
            values={linkedFicheIdsState.map((id) => id.toString())}
            onChange={({ fiches }) =>
              setLinkedFicheIdsState(fiches.map((f) => f.id))
            }
          />
        </Field>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            updateLinkedFicheIds(linkedFicheIdsState);
            setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
