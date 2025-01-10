import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Modal } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { useAddPreuveReglementaireToAction } from './useAddPreuveToAction';

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
  const { preuve_id, isDisabled } = props;
  const handlers = useAddPreuveReglementaireToAction(preuve_id);
  const currentCollectivite = useCurrentCollectivite();
  if (!currentCollectivite || currentCollectivite.isReadOnly) {
    return null;
  }

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      title="Ajouter un document attendu"
      render={({ close }) => {
        return (
          <AddPreuveModal
            docType="reglementaire"
            onClose={close}
            handlers={handlers}
          />
        );
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
