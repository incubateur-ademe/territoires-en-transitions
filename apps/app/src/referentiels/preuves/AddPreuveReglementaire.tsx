import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { useAddPreuveReglementaireToAction } from './useAddPreuveToAction';

export type TAddPreuveButtonProps = {
  preuve_id: string;
  isDisabled: boolean;
};

export const AddPreuveReglementaire = (props: TAddPreuveButtonProps) => {
  const [opened, setOpened] = useState(false);
  const { preuve_id, isDisabled } = props;
  const handlers = useAddPreuveReglementaireToAction(preuve_id);
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
          dataTest={`AddPreuveReglementaire-${preuve_id}`}
          size="xs"
          icon="file-add-fill"
          variant={isDisabled ? 'outlined' : 'primary'}
          title={appLabels.ajouterPreuve}
          className="w-12 flex items-center justify-center"
        />
      </Modal.Trigger>
      <Modal.Header>
        <Modal.Title>{appLabels.ajouterDocumentAttendu}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AddPreuveModal
          docType="reglementaire"
          onClose={() => setOpened(false)}
          handlers={handlers}
        />
      </Modal.Body>
    </Modal>
  );
};
