'use client';

import { useAddPreuveToDemande } from '@/app/referentiels/labellisations/useAddPreuveToDemande';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { ObjetPreuve } from '@tet/domain/referentiels';
import { Modal, PillButton } from '@tet/ui';
import { ReactElement, useState } from 'react';

export const UploadPreuveButton = ({
  title,
  label,
  objet,
  replacePreuveId,
}: {
  title: string;
  label: string;
  objet: ObjetPreuve;
  replacePreuveId?: number;
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const handlers = useAddPreuveToDemande({ objet, replacePreuveId });

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
        icon="upload-line"
        onClick={() => setIsOpen(true)}
        iconPosition="right"
      >
        {label}
      </PillButton>
    </Modal>
  );
};
