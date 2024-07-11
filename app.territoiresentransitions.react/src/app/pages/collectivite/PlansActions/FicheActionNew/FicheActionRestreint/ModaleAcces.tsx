import {useState} from 'react';
import {Button, Checkbox, FormSectionGrid, Modal} from '@tet/ui';

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
      render={({descriptionId, close}) => (
        <div>
          <div id={descriptionId} className="flex flex-col gap-8">
            <FormSectionGrid>
              <Checkbox
                variant="switch"
                label="Fiche action en mode privé"
                message="Seulement les membres de la collectivité peuvent voir la fiche"
                containerClassname="col-span-2"
                checked={editedRestreint}
                onChange={() => setEditedFiche(prevState => !prevState)}
              />
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

export default ModaleAcces;
