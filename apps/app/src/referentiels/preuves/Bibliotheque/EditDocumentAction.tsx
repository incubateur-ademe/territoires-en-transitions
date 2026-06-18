import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { EditerDocumentModal } from './EditerDocumentModal';
import { EditerLienModal } from './EditerLienModal';
import { TPreuve } from './types';

type EditDocumentActionProps = {
  document: Pick<
    TPreuve,
    'id' | 'fichier' | 'lien' | 'collectivite_id' | 'preuve_type'
  >;
};

export const EditDocumentAction = ({ document }: EditDocumentActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { fichier } = document;

  return (
    <>
      <Button
        data-test="btn-edit"
        icon="edit-line"
        title={fichier ? appLabels.editerDocument : appLabels.editerLien}
        variant="grey"
        size="xs"
        onClick={() => setIsOpen(true)}
      />
      {isOpen &&
        (fichier ? (
          <EditerDocumentModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            preuve={document}
          />
        ) : (
          <EditerLienModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            preuve={document}
          />
        ))}
    </>
  );
};
