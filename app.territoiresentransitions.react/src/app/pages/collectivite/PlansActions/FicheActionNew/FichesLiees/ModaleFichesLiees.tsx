import {useEffect, useState} from 'react';
import _ from 'lodash';
import {Button, Field, FormSectionGrid, Modal} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import FichesResumeDropdown from 'ui/dropdownLists/FichesLieesDropdown/FichesResumeDropdown';

type ModaleFichesLieesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleFichesLiees = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModaleFichesLieesProps) => {
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
      title="Lier une fiche action"
      size="lg"
      render={({descriptionId, close}) => (
        <div>
          <div id={descriptionId} className="flex flex-col gap-8">
            <FormSectionGrid>
              <Field title="Fiches des plans liées" className="col-span-2">
                <FichesResumeDropdown
                  ficheCouranteId={fiche.id}
                  values={editedFiche.fiches_liees?.map(f => f.id.toString())}
                  onChange={({fiches}) =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      fiches_liees: fiches,
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

export default ModaleFichesLiees;
