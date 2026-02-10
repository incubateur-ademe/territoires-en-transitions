import { EditerDocumentModal } from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import { TPreuve } from '@/app/referentiels/preuves/Bibliotheque/types';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Button } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { EditerLienModal } from './EditerLienModal';

type MenuCarteDocumentProps = {
  document: Pick<
    TPreuve,
    'id' | 'fichier' | 'lien' | 'collectivite_id' | 'preuve_type'
  >;
  className?: string;
  onComment: () => void;
  onDelete: () => void;
};

const MenuCarteDocument = ({
  document,
  className,
  onComment,
  onDelete,
}: MenuCarteDocumentProps) => {
  const { fichier, lien } = document;
  const [isOpen, setIsOpen] = useState(false);

  if (!fichier && !lien) return null;

  return (
    <>
      <div className={classNames('flex gap-2', className)}>
        {/* Modifier le titre du document */}
        <Button
          data-test="btn-edit"
          icon="edit-line"
          title={fichier ? 'Editer le document' : 'Editer le lien'}
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

        {/* Commenter */}
        <Button
          data-test="btn-comment"
          icon="discuss-line"
          title="Commenter"
          variant="grey"
          size="xs"
          onClick={onComment}
        />

        {/* Supprimer le document */}
        <DeleteButton
          data-test="btn-delete"
          title="Supprimer le document"
          size="xs"
          onClick={onDelete}
        />
      </div>
    </>
  );
};

export default MenuCarteDocument;
