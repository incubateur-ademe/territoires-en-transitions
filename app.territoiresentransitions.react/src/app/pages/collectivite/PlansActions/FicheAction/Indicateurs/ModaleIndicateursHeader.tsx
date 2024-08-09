import {useState} from 'react';
import _ from 'lodash';
import {
  Button,
  Field,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  Textarea,
} from '@tet/ui';
import {FicheAction} from '../data/types';
import EffetsAttendusDropdown from 'ui/dropdownLists/EffetsAttendusDropdown/EffetsAttendusDropdown';

type ModaleIndicateursHeaderProps = {
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleIndicateursHeader = ({
  fiche,
  updateFiche,
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
      render={({descriptionId}) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Objectifs */}
          <Field title="Objectifs" className="col-span-2">
            <Textarea
              className="min-h-[100px]"
              value={editedFiche.objectifs ?? ''}
              onChange={evt =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  objectifs: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>

          {/* Effets attendus */}
          <Field title="Effets attendus" className="col-span-2">
            <EffetsAttendusDropdown
              values={editedFiche.resultats_attendus ?? []}
              onChange={({effets}) =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  resultats_attendus: effets,
                }))
              }
            />
          </Field>
        </FormSectionGrid>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{onClick: close}}
          btnOKProps={{
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    >
      <Button
        title="Modifier les informations"
        icon="edit-line"
        size="xs"
        variant="grey"
      />
    </Modal>
  );
};

export default ModaleIndicateursHeader;
