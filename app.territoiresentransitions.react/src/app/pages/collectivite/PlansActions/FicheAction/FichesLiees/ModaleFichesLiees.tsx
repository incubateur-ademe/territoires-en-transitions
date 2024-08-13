import {useEffect, useState} from 'react';
import _ from 'lodash';
import {Field, Modal, ModalFooterOKCancel} from '@tet/ui';
import {FicheAction} from '../data/types';
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
  }, [isOpen]);

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
      render={({descriptionId}) => (
        <Field fieldId={descriptionId} title="Fiches des plans liées">
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
    />
  );
};

export default ModaleFichesLiees;
