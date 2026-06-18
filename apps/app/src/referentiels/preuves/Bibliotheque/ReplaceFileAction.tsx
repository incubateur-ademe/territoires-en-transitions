import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Button, Modal } from '@tet/ui';
import { useState } from 'react';

type ReplaceFileActionProps = {
  onReplace: (fichierId: number) => Promise<void>;
};

export const ReplaceFileAction = ({ onReplace }: ReplaceFileActionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      size="lg"
      openState={{ isOpen, setIsOpen }}
      title={appLabels.remplacerLeFichier}
      render={({ close }) => (
        <AddPreuveModal
          onClose={close}
          handlers={{
            addFileFromLib: async (fichierId) => {
              await onReplace(fichierId);
              close();
            },
          }}
        />
      )}
    >
      <Button
        data-test="btn-replace"
        icon="file-transfer-line"
        title={appLabels.remplacerLeFichier}
        variant="grey"
        size="xs"
        onClick={() => setIsOpen(true)}
      />
    </Modal>
  );
};
