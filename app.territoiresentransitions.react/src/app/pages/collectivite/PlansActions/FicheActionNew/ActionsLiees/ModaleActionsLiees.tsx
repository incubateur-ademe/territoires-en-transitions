import {useEffect, useState} from 'react';
import _ from 'lodash';
import {Button, Field, FormSectionGrid, Modal} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import ActionsReferentielsDropdown from 'ui/dropdownLists/ActionsReferentielsDropdown/ActionsReferentielsDropdown';

type ModaleActionsLieesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleActionsLiees = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModaleActionsLieesProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen, fiche]);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Lier une action des référentiels"
      size="lg"
      render={({descriptionId, close}) => (
        <div>
          <div id={descriptionId} className="flex flex-col gap-8">
            <FormSectionGrid>
              <Field
                title="Actions des référentiels liées"
                className="col-span-2"
              >
                <ActionsReferentielsDropdown
                  values={editedFiche.actions?.map(action => action.id)}
                  onChange={({actions}) =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      actions,
                    }))
                  }
                />
              </Field>
            </FormSectionGrid>
          </div>

          {/* Boutons pour valider / annuler les modifications */}
          <div className="flex justify-end gap-4 mt-12">
            <Button onClick={close} aria-label="Annuler" variant="outlined">
              Annuler
            </Button>
            <Button
              onClick={() => {
                handleSave();
                close();
              }}
              aria-label="Valider"
            >
              Valider
            </Button>
          </div>
        </div>
      )}
    />
  );
};

export default ModaleActionsLiees;
