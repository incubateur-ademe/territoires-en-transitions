'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  EditerDocumentModal,
  EditerDocumentProps,
} from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import { PillButton } from '@tet/ui';
import { ReactElement, useState } from 'react';

export const RenamePreuveButton = ({
  preuve,
}: {
  preuve: EditerDocumentProps['preuve'];
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <PillButton
        icon="edit-line"
        onClick={() => setIsOpen(true)}
        iconPosition="right"
      >
        {appLabels.renommerLeFichier}
      </PillButton>
      <EditerDocumentModal preuve={preuve} isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};
