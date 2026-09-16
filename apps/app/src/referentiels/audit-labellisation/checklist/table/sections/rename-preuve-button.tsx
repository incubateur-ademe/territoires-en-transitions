'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  EditFichierModal,
  EditFichierModalProps,
} from '@/app/referentiels/preuves/Bibliotheque/edit-fichier.modal';
import { Button } from '@tet/ui';
import { ReactElement, useState } from 'react';

export const RenamePreuveButton = ({
  preuve,
}: {
  preuve: EditFichierModalProps['preuve'];
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        icon="edit-line"
        title={appLabels.renommerLeFichier}
        onClick={() => setIsOpen(true)}
        size="xs"
        variant="grey"
      />
      <EditFichierModal
        preuve={preuve}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </>
  );
};
