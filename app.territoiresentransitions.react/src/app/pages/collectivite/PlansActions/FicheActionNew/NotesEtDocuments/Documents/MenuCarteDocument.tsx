import classNames from 'classnames';
import {Button} from '@tet/ui';
import {TPreuve} from 'ui/shared/preuves/Bibliotheque/types';

type MenuCarteDocumentProps = {
  document: TPreuve;
  className?: string;
  onEdit: (() => void) | undefined;
  onComment: () => void;
  onDelete: () => void;
};

const MenuCarteDocument = ({
  document,
  className,
  onEdit,
  onComment,
  onDelete,
}: MenuCarteDocumentProps) => {
  const {fichier, lien} = document;

  if (!fichier && !lien) return null;

  return (
    <>
      <div className={classNames('flex gap-2', className)}>
        {/* Modifier le titre du document */}
        {!!onEdit && (
          <Button
            icon="edit-line"
            title="Renommer le document"
            variant="grey"
            size="xs"
            onClick={onEdit}
          />
        )}

        {/* Commenter */}
        <Button
          icon="discuss-line"
          title="Commenter"
          variant="grey"
          size="xs"
          onClick={onComment}
        />

        {/* Supprimer le document */}
        <Button
          icon="delete-bin-6-line"
          title="Supprimer le document"
          variant="grey"
          size="xs"
          onClick={onDelete}
        />
      </div>
    </>
  );
};

export default MenuCarteDocument;
