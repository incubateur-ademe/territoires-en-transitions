import { useCurrentCollectivite } from '@/api/collectivites';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Button, Modal } from '@/ui';
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
      <Button
        dataTest="AddDocsButton"
        icon="add-line"
        variant="outlined"
        size="sm"
        onClick={() => setOpened(true)}
      >
        Ajouter
      </Button>
    </Modal>
  );
};
