'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { JSX, useState } from 'react';
import { PcaetContactsModal } from './contacts.modal';

export const PcaetContactsButton = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outlined"
        size="xs"
        icon="mail-line"
        dataTest="demarches.pcaet.voir-contacts-button"
        onClick={() => setIsOpen(true)}
      >
        {appLabels.voirContacts}
      </Button>
      {isOpen && (
        <PcaetContactsModal
          collectiviteId={collectiviteId}
          openState={{ isOpen, setIsOpen }}
        />
      )}
    </>
  );
};
