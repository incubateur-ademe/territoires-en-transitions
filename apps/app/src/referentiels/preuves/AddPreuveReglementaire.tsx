import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Modal } from '@tet/ui';
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
      title={appLabels.ajouterDocumentAttendu}
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
        dataTest={`AddPreuveReglementaire-${preuve_id}`}
        size="xs"
        icon="file-add-fill"
        variant={isDisabled ? 'outlined' : 'primary'}
        title={appLabels.ajouterPreuve}
        onClick={() => setOpened(true)}
        className="w-12 flex items-center justify-center"
      />
    </Modal>
  );
};
