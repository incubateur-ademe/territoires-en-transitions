import {useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';
import {useAddPreuveComplementaireToAction} from './useAddPreuveToAction';

export type TAddPreuveButtonProps = {
  action_id: string;
};

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * une preuve complémentaire à une action
 */
export const AddPreuveComplementaire = (props: TAddPreuveButtonProps) => {
  const [opened, setOpened] = useState(false);
  const {action_id} = props;
  const handlers = useAddPreuveComplementaireToAction(action_id);

  return (
    <Modal
      size="lg"
      externalOpen={opened}
      setExternalOpen={setOpened}
      render={() => {
        return (
          <>
            <h4>Ajouter une preuve complémentaire</h4>
            <AddPreuveModal
              onClose={() => setOpened(false)}
              handlers={handlers}
            />
          </>
        );
      }}
    >
      <button
        data-test="AddPreuveComplementaire"
        className="fr-btn fr-btn--sm fr-btn--secondary fr-btn--icon-left fr-fi-add-line"
        onClick={() => setOpened(true)}
      >
        Ajouter une preuve complémentaire
      </button>
    </Modal>
  );
};
