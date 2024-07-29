import {useState} from 'react';
import {Checkbox, FormSectionGrid, Modal, ModalFooterOKCancel} from '@tet/ui';

type ModaleAccesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  isRestreint: boolean;
  updateRestreint: (isRestreint: boolean) => void;
};

const ModaleAcces = ({
  isOpen,
  setIsOpen,
  isRestreint,
  updateRestreint,
}: ModaleAccesProps) => {
  const [editedRestreint, setEditedFiche] = useState(isRestreint);

  const handleSave = () => {
    if (isRestreint !== editedRestreint) {
      updateRestreint(editedRestreint);
    }
  };

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Restriction des accès à la fiche"
      size="md"
      render={({descriptionId}) => (
        <FormSectionGrid formSectionId={descriptionId}>
          <Checkbox
            variant="switch"
            label="Fiche action en mode privé"
            message="Seulement les membres de la collectivité peuvent voir la fiche"
            containerClassname="col-span-2"
            checked={editedRestreint}
            onChange={() => setEditedFiche(prevState => !prevState)}
          />
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
    />
  );
};

export default ModaleAcces;
