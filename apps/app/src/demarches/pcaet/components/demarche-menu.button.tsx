'use client';

import { appLabels } from '@/app/labels/catalog';
import { ButtonMenu, MenuAction } from '@tet/ui';
import { JSX, useState } from 'react';
import { PcaetContactsModal } from './contacts.modal';

export const DemarcheMenuButton = (): JSX.Element => {
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

  const menuActions: MenuAction[] = [
    {
      label: appLabels.voirContacts,
      icon: 'mail-line',
      onClick: () => {
        setIsContactsModalOpen(true);
      },
    },
  ];

  return (
    <>
      <ButtonMenu
        title={appLabels.demarcheMenuTitre}
        icon="more-line"
        variant="grey"
        size="xs"
        menu={{
          actions: menuActions,
        }}
      />
      {isContactsModalOpen && (
        <PcaetContactsModal
          openState={{
            isOpen: isContactsModalOpen,
            setIsOpen: setIsContactsModalOpen,
          }}
        />
      )}
    </>
  );
};
