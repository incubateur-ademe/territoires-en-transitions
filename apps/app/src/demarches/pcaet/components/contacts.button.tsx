'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, useEventTracker, Event } from '@tet/ui';
import { JSX, useState } from 'react';
import { PcaetContactsModal } from './contacts.modal';

export const PcaetContactsButton = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const tracker = useEventTracker();

  return (
    <>
      <Button
        variant="outlined"
        size="xs"
        icon="mail-line"
        dataTest="demarches.pcaet.voir-contacts-button"
        onClick={() => {
          tracker(Event.demarches.pcaet.contactsOuverts);
          setIsOpen(true);
        }}
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
