import { FicheAction } from '@/api/plan-actions';
import EffetsAttendusDropdown from '@/app/ui/dropdownLists/ficheAction/EffetsAttendusDropdown/EffetsAttendusDropdown';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';
import {
  Field,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  Textarea,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';
import _ from 'lodash';
import { useState } from 'react';

const OBJECTIFS_MAX_LENGTH = 10000;

type ModaleIndicateursHeaderProps = {
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
  openState: OpenState;
};

const ModaleIndicateursHeader = ({
  fiche,
  updateFiche,
  openState,
}: ModaleIndicateursHeaderProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
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
              OBJECTIFS_MAX_LENGTH
            )}
          >
            <Textarea
              className="min-h-[100px]"
              value={editedFiche.objectifs ?? ''}
              maxLength={OBJECTIFS_MAX_LENGTH}
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  objectifs: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>

          {/* Effets attendus */}
          <Field title="Effets attendus" className="col-span-2">
            <EffetsAttendusDropdown
              values={editedFiche.resultatsAttendus ?? []}
              onChange={({ effets }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  resultatsAttendus: effets,
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
