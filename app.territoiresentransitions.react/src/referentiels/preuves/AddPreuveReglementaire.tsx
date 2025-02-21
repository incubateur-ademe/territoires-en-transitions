import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Button, Modal } from '@/ui';
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
      <Button
        dataTest="AddPreuveReglementaire"
        size="sm"
        icon="add-line"
        variant={isDisabled ? 'outlined' : 'primary'}
        title="Ajouter une preuve"
        onClick={() => setOpened(true)}
      />
    </Modal>
  );
};
