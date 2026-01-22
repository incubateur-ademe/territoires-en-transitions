import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Modal } from '@tet/ui';
import { useState } from 'react';
import { useAddPreuveToAudit } from './useAddPreuveToAudit';

export type TAddDocsButtonProps = {
  audit_id: number;
};

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * le rapport d'audit.
 */
export const AddRapportButton = (props: TAddDocsButtonProps) => {
  const [opened, setOpened] = useState(false);
  const handlers = useAddPreuveToAudit(props.audit_id);
  const { hasCollectivitePermission } = useCurrentCollectivite();
  if (!hasCollectivitePermission('referentiels.mutate')) {
    return null;
  }

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      title="Ajouter le rapport d'audit"
      render={({ close }) => {
        return <AddPreuveModal onClose={close} handlers={handlers} />;
      }}
    >
      <Button
        dataTest="AddRapportButton"
        className="mb-6"
        onClick={() => setOpened(true)}
        variant="outlined"
        size="sm"
      >
        {"Ajouter le rapport d'audit"}
      </Button>
    </Modal>
  );
};
