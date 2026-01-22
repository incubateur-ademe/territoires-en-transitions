import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Modal } from '@tet/ui';
import { useState } from 'react';
import { useAddPreuveToDemande } from './useAddPreuveToDemande';

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * des documents à une demande de labellisation
 */
export const AddDocsButton = () => {
  const [opened, setOpened] = useState(false);
  const handlers = useAddPreuveToDemande();
  const { hasCollectivitePermission } = useCurrentCollectivite();
  if (!hasCollectivitePermission('referentiels.mutate')) {
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
