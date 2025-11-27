import EffetsAttendusDropdown from '@/app/ui/dropdownLists/ficheAction/EffetsAttendusDropdown/EffetsAttendusDropdown';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';
import { FicheWithRelations } from '@/domain/plans';
import {
  Field,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  RichTextEditor,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';

import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { isEqual } from 'es-toolkit/predicate';
import { useState } from 'react';

const OBJECTIFS_MAX_LENGTH = 10000;

type ModaleIndicateursHeaderProps = {
  fiche: FicheWithRelations;
  openState: OpenState;
};

const ModaleIndicateursHeader = ({
  fiche,
  openState,
}: ModaleIndicateursHeaderProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { mutate: updateFiche } = useUpdateFiche();

  const handleSave = () => {
    if (!isEqual(fiche, editedFiche)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          objectifs: editedFiche.objectifs,
          effetsAttendus: editedFiche.effetsAttendus,
        },
      });
    }
  };

  return (
    <Modal
      title="Indicateurs de suivi"
      size="lg"
      openState={openState}
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Objectifs */}
          <Field
            title="Objectifs"
            className="col-span-2"
            state={
              editedFiche.objectifs?.length === OBJECTIFS_MAX_LENGTH
                ? 'info'
                : 'default'
            }
            message={getMaxLengthMessage(
              editedFiche.objectifs ?? '',
              OBJECTIFS_MAX_LENGTH,
              true
            )}
          >
            <RichTextEditor
              className="!text-sm"
              initialValue={fiche.objectifs ?? ''}
              onChange={(value) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  objectifs: value,
                }))
              }
            />
          </Field>

          {/* Effets attendus */}
          <Field title="Effets attendus" className="col-span-2">
            <EffetsAttendusDropdown
              values={editedFiche.effetsAttendus ?? []}
              onChange={({ effets }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  effetsAttendus: effets,
                }))
              }
            />
          </Field>
        </FormSectionGrid>
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

export default ModaleIndicateursHeader;
