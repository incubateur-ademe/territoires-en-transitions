import { FicheAction } from '@/api/plan-actions';
import ActionsReferentielsDropdown from '@/app/ui/dropdownLists/ActionsReferentielsDropdown/ActionsReferentielsDropdown';
import { Field, Modal, ModalFooterOKCancel } from '@/ui';
import _ from 'lodash';
import { useEffect, useState } from 'react';

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
      openState={{ isOpen, setIsOpen }}
      title="Lier une mesure des référentiels"
      size="lg"
      render={({ descriptionId }) => (
        <Field fieldId={descriptionId} title="Mesures des référentiels liées">
          <ActionsReferentielsDropdown
            values={editedFiche.actions?.map((action) => action.id)}
            onChange={({ actions }) =>
              setEditedFiche((prevState) => ({
                ...prevState,
                actions,
              }))
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

export default ModaleActionsLiees;
