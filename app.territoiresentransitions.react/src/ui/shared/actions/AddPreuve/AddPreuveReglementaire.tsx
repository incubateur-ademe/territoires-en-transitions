import classNames from 'classnames';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useState} from 'react';
import {Modal} from '@tet/ui';
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
      openState={{isOpen: opened, setIsOpen: setOpened}}
      title="Ajouter un document attendu"
      render={({close}) => {
        return <AddPreuveModal onClose={close} handlers={handlers} />;
      }}
    >
      <button
        data-test="AddPreuveReglementaire"
        className={classNames('fr-btn fr-icon-add-line box-border', {
          'fr-btn--secondary': isDisabled,
        })}
        title="Ajouter une preuve"
        onClick={() => setOpened(true)}
      />
    </Modal>
  );
};
