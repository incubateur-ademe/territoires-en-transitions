'use client';

import { useAddPreuveToDemande } from '@/app/referentiels/labellisations/useAddPreuveToDemande';
import { AddDocumentTabs } from '@/app/collectivites/documents/add-document/add-document.tabs';
import { ObjetPreuve } from '@tet/domain/referentiels';
import { Modal, PillButton } from '@tet/ui';
import { ReactElement, useState } from 'react';

export const UploadPreuveButton = ({
  title,
  label,
  objet,
}: {
  title: string;
  label: string;
  objet: ObjetPreuve;
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const handlers = useAddPreuveToDemande({ objet });

  return (
    <Modal
      size="lg"
      openState={{ isOpen, setIsOpen }}
      title={title}
      render={({ close }) => (
        <AddDocumentTabs onClose={close} handlers={handlers} />
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
