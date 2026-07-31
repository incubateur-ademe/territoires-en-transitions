import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Modal } from '@tet/ui';
import { useState } from 'react';
import { useReferentielId } from '../referentiel-context';
import { useAddPreuveToDemande } from './useAddPreuveToDemande';

export const AddDocsButton = () => {
  const [opened, setOpened] = useState(false);
  const handlers = useAddPreuveToDemande();
  const referentielId = useReferentielId();
  const { hasReferentielPermission } = useCurrentCollectivite();
  if (!hasReferentielPermission('referentiels.mutate', referentielId)) {
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
