import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import {
  ActionListItem,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import MesuresReferentielsDropdown from '@/app/ui/dropdownLists/MesuresReferentielsDropdown/MesuresReferentielsDropdown';
import { Field, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { isEqual } from 'es-toolkit/predicate';
import { useMemo, useState } from 'react';
import { Fiche } from '../data/use-get-fiche';

type MesuresLieesModalProps = {
  openState: OpenState;
  fiche: Fiche;
};

const buildMesureIdsWithAncestors = (
  selectedIds: string[] | undefined,
  actions: ActionListItem[] | undefined
): string[] | undefined => {
  if (!selectedIds) {
    return undefined;
  }

  if (!actions || actions.length === 0) {
    return selectedIds;
  }

  const actionsById = new Map(actions.map((action) => [action.actionId, action]));
  const allIds = new Set(selectedIds);

  const getParentId = (actionId: string) => {
    const [prefix, rest] = actionId.split('_');
    if (!rest) {
      return null;
    }
    const parts = rest.split('.');
    if (parts.length <= 1) {
      return null;
    }
    const parentRest = parts.slice(0, -1).join('.');
    return `${prefix}_${parentRest}`;
  };

  selectedIds.forEach((id) => {
    let currentId: string | null = id;

    while (currentId) {
      const parentId = getParentId(currentId);
      if (!parentId) {
        break;
      }
      if (!actionsById.has(parentId)) {
        break;
      }
      if (allIds.has(parentId)) {
        break;
      }
      allIds.add(parentId);
      currentId = parentId;
    }
  });

  return Array.from(allIds);
};

export const MesuresLieesModal = ({
  openState,
  fiche,
}: MesuresLieesModalProps) => {
  const ficheMesureIds = fiche.mesures?.map((mesure) => mesure.id);
  const [editedMesureIds, setEditedMesureIds] = useState(ficheMesureIds);

  const { data: mesureListe } = useListActions();
  const editedMesureIdsWithAncestors = useMemo(
    () => buildMesureIdsWithAncestors(editedMesureIds, mesureListe),
    [editedMesureIds, mesureListe]
  );

  const { mutate: updateFiche } = useUpdateFiche();

  const handleSave = () => {
    if (!isEqual(ficheMesureIds, editedMesureIdsWithAncestors)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          mesures: editedMesureIdsWithAncestors?.map((id) => ({ id })),
        },
      });
    }
  };

  return (
    <Modal
      openState={openState}
      title="Lier une mesure des référentiels"
      size="lg"
      disableDismiss
      render={({ descriptionId }) => (
        <Field fieldId={descriptionId} title="Mesures des référentiels">
          <MesuresReferentielsDropdown
            values={editedMesureIds}
            onChange={({ values }) =>
              setEditedMesureIds((values as string[]) ?? [])
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
