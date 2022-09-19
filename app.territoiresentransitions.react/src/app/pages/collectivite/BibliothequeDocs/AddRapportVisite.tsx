import {useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';
import {useAddRapportVisite} from './useAddRapportVisite';

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * un rapport de visite annuelle
 */
export const AddRapportVisite = () => {
  const [opened, setOpened] = useState(false);
  const handlers = useAddRapportVisite();

  return (
    <Modal
      size="lg"
      externalOpen={opened}
      setExternalOpen={setOpened}
      render={() => {
        return (
          <>
            <h4>Ajouter un rapport de visite annuelle</h4>
            <AddPreuveModal
              onClose={() => setOpened(false)}
              handlers={handlers}
              mode="rapport"
            />
          </>
        );
      }}
    >
      <button
        data-test="AddDocsButton"
        className="fr-btn fr-btn--sm fr-btn--secondary"
        onClick={() => setOpened(true)}
      >
        +&nbsp;Ajouter
      </button>
    </Modal>
  );
};
