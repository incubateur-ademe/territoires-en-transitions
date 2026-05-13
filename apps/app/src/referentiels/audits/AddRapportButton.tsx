import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { useAddPreuveToAudit } from './useAddPreuveToAudit';

export const AddRapportButton = ({ auditId }: { auditId: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handlers = useAddPreuveToAudit(auditId);
  const { hasCollectivitePermission } = useCurrentCollectivite();

  if (!hasCollectivitePermission('referentiels.mutate')) {
    return null;
  }

  return (
    <Modal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }} size="lg">
      <Modal.Trigger>
        <Button
          dataTest="AddRapportButton"
          className="mb-6"
          variant="outlined"
          size="sm"
        >
          {appLabels.ajouterRapportAudit}
        </Button>
      </Modal.Trigger>
      <Modal.Header>
        <Modal.Title>{appLabels.ajouterRapportAudit}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AddPreuveModal onClose={() => setIsOpen(false)} handlers={handlers} />
      </Modal.Body>
    </Modal>
  );
};
