import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { useAddPreuveToDemande } from './useAddPreuveToDemande';

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
    >
      <Modal.Trigger>
        <Button
          dataTest="AddDocsButton"
          icon="add-line"
          variant="outlined"
          size="sm"
        >
          {appLabels.ajouter}
        </Button>
      </Modal.Trigger>
      <Modal.Header>
        <Modal.Title>{appLabels.ajouterDocument}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AddPreuveModal
          onClose={() => setOpened(false)}
          handlers={handlers}
        />
      </Modal.Body>
    </Modal>
  );
};
