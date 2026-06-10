'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  EditerDocumentModal,
  EditerDocumentProps,
} from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import { Button } from '@tet/ui';
import { ReactElement, useState } from 'react';

export const RenamePreuveButton = ({
  preuve,
}: {
  preuve: EditerDocumentProps['preuve'];
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        icon="edit-line"
        title={appLabels.renommerLeFichier}
        onClick={() => setIsOpen(true)}
        size="xs"
        variant="outlined"
      />
      <EditerDocumentModal
        preuve={preuve}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </>
  );
};
