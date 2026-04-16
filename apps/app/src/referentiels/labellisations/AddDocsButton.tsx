import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Modal } from '@tet/ui';
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
      title={appLabels.ajouterDocument}
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
        {appLabels.ajouter}
      </Button>
    </Modal>
  );
};
