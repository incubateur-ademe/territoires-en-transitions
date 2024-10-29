import classNames from 'classnames';
import { Button } from '@tet/ui';
import { TPreuve } from 'ui/shared/preuves/Bibliotheque/types';
import { EditerDocumentModal } from 'ui/shared/preuves/Bibliotheque/EditerDocumentModal';
import DeleteButton from '../../../../app/pages/collectivite/PlansActions/FicheAction/DeleteButton';
import { useState } from 'react';

type MenuCarteDocumentProps = {
  document: TPreuve;
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
        {!!fichier && (
          <Button
            data-test="btn-edit"
            icon="edit-line"
            title="Editer le document"
            variant="grey"
            size="xs"
            onClick={() => setIsOpen(true)}
          />
        )}
        {isOpen && (
          <EditerDocumentModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            preuve={document}
          />
        )}

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
