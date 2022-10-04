import classNames from 'classnames';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';
import {useAddPreuveReglementaireToAction} from './useAddPreuveToAction';

export type TAddPreuveButtonProps = {
  preuve_id: string;
  /** indique si l'action associée à la preuve est désactivée ou marquée "non
   * concernée" */
  isDisabled: boolean;
};

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * une preuve réglementaire à une action
 */

export const AddPreuveReglementaire = (props: TAddPreuveButtonProps) => {
  const [opened, setOpened] = useState(false);
  const {preuve_id, isDisabled} = props;
  const handlers = useAddPreuveReglementaireToAction(preuve_id);
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
            <h4>Ajouter une preuve attendue</h4>
            <AddPreuveModal
              onClose={() => setOpened(false)}
              handlers={handlers}
            />
          </>
        );
      }}
    >
      <button
        data-test="AddPreuveReglementaire"
        className={classNames('fr-btn fr-fi-add-line', {
          'fr-btn--secondary': isDisabled,
        })}
        title="Ajouter une preuve"
        onClick={() => setOpened(true)}
      />
    </Modal>
  );
};
