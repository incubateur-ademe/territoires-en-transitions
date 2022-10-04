import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';
import {useAddPreuveToDemande} from './useAddPreuveToDemande';

export type TAddDocsButtonProps = {
  demande_id: number;
};

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * des documents à une demande de labellisation
 */
export const AddDocsButton = (props: TAddDocsButtonProps) => {
  const [opened, setOpened] = useState(false);
  const handlers = useAddPreuveToDemande(props.demande_id);
  const currentCollectivite = useCurrentCollectivite();
  if (!currentCollectivite || currentCollectivite.readonly) {
    return null;
  }

  return (
    <Modal
      size="lg"
      externalOpen={opened}
      setExternalOpen={setOpened}
      render={() => {
        return (
          <>
            <h4>Ajouter un document</h4>
            <AddPreuveModal
              onClose={() => setOpened(false)}
              handlers={handlers}
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
