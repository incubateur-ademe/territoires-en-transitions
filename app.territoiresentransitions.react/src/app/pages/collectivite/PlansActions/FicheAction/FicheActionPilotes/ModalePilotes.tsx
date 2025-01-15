import { FicheAction } from '@/api/plan-actions';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { Field, FormSectionGrid, Modal, ModalFooterOKCancel } from '@/ui';
import _ from 'lodash';
import { useState } from 'react';

type ModalePilotesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModalePilotes = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModalePilotesProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Pilotes du projet"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Personnes pilote */}
          <Field title="Personne pilote" className="col-span-2">
            <PersonnesDropdown
              dataTest="personnes-pilotes"
              values={editedFiche.pilotes?.map((p) => getPersonneStringId(p))}
              placeholder="Sélectionnez ou créez un pilote"
              onChange={({ personnes }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  pilotes: personnes,
                }))
              }
              additionalKeysToInvalidate={[
                ['fiche_action', fiche.id.toString()],
              ]}
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

export default ModalePilotes;
