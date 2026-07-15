'use client';

import { useAddPreuveToDemande } from '@/app/referentiels/labellisations/useAddPreuveToDemande';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Modal, PillButton } from '@tet/ui';
import { ReactElement, useState } from 'react';
import { RiUploadLine } from '@remixicon/react';

export const UploadPreuveButton = ({
  title,
  label,
  replacePreuveId,
}: {
  title: string;
  label: string;
  replacePreuveId?: number;
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const handlers = useAddPreuveToDemande({ replacePreuveId });

  return (
    <Modal
      size="lg"
      openState={{ isOpen, setIsOpen }}
      title={title}
      render={({ close }) => (
        <AddPreuveModal onClose={close} handlers={handlers} />
      )}
    >
      <PillButton
        icon={<RiUploadLine />}
        onClick={() => setIsOpen(true)}
        iconPosition="right"
      >
        {label}
      </PillButton>
    </Modal>
  );
};
