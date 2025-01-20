import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { AddPreuveModal } from '@/app/ui/shared/preuves/AddPreuveModal';
import { Modal } from '@/ui';
import { useState } from 'react';
import { useAddPreuveToDemande } from './useAddPreuveToDemande';

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * des documents à une demande de labellisation
 */
export const AddDocsButton = () => {
  const [opened, setOpened] = useState(false);
  const handlers = useAddPreuveToDemande();
  const currentCollectivite = useCurrentCollectivite();
  if (!currentCollectivite || currentCollectivite.isReadOnly) {
    return null;
  }

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      title="Ajouter un document"
      render={({ close }) => {
        return <AddPreuveModal onClose={close} handlers={handlers} />;
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
