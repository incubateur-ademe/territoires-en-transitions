import {useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {AddDocs} from './AddDocs';

export type TAddDocsButtonProps = {
  demande_id: number;
};

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers
 */
export const AddDocsButton = (props: TAddDocsButtonProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <Modal
      size="lg"
      externalOpen={opened}
      setExternalOpen={setOpened}
      render={() => {
        return (
          <>
            <h4>Ajouter un document</h4>
            <AddDocs {...props} onClose={() => setOpened(false)} />
          </>
        );
      }}
    >
      <button
        data-test="AddDocsButton"
        className="fr-btn fr-btn--sm fr-btn--secondary"
        onClick={e => {
          e.preventDefault();
          setOpened(true);
        }}
      >
        +&nbsp;Ajouter
      </button>
    </Modal>
  );
};
