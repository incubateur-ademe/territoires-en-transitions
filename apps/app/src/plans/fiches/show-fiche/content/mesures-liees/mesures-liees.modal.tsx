import { appLabels } from '@/app/labels/catalog';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import MesuresReferentielsDropdown from '@/app/ui/dropdownLists/MesuresReferentielsDropdown/MesuresReferentielsDropdown';
import { FicheWithRelations } from '@tet/domain/plans';
import { Field } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { isEqual } from 'es-toolkit/predicate';
import { useState } from 'react';

type MesuresLieesModalProps = {
  openState: OpenState;
  fiche: FicheWithRelations;
};

export const MesuresLieesModal = ({
  openState,
  fiche,
}: MesuresLieesModalProps) => {
  const ficheMesureIds = fiche.mesures?.map((mesure) => mesure.id);
  const [editedMesureIds, setEditedMesureIds] = useState(ficheMesureIds);

  const { update } = useFicheContext();

  const handleSave = () => {
    if (!isEqual(ficheMesureIds, editedMesureIds)) {
      update({
        ficheId: fiche.id,
        ficheFields: {
          mesures: editedMesureIds?.map((id) => ({ id })),
        },
      });
    }
  };

  return (
    <Modal
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
      size="lg"
      dismissable={false}
    >
      <Modal.Header>
        <Modal.Title>{appLabels.lierMesureReferentiels}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Field title={appLabels.mesuresLiees}>
          <MesuresReferentielsDropdown
            values={editedMesureIds}
            onChange={({ values }) =>
              setEditedMesureIds((values as string[]) ?? [])
            }
          />
        </Field>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            handleSave();
            openState.setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
