import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Button } from '@tet/ui';
import classNames from 'classnames';
import { Preuve } from './types';

const EditDocumentButton = ({
  document,
  onEdit,
}: {
  document: Pick<Preuve, 'support'>;
  onEdit: () => void;
}) => (
  <Button
    icon="edit-line"
    title={
      document.support.type === 'lien'
        ? appLabels.editerLien
        : appLabels.editerDocument
    }
    variant="grey"
    size="xs"
    onClick={onEdit}
  />
);

const ReplaceFileButton = ({ onReplace }: { onReplace: () => void }) => (
  <Button
    icon="file-transfer-line"
    title={appLabels.remplacerLeFichier}
    variant="grey"
    size="xs"
    onClick={onReplace}
  />
);

const CommentButton = ({ onComment }: { onComment: () => void }) => (
  <Button
    icon="discuss-line"
    title={appLabels.commenter}
    variant="grey"
    size="xs"
    onClick={onComment}
  />
);

const DeleteDocumentButton = ({ onDelete }: { onDelete: () => void }) => (
  <DeleteButton title={appLabels.supprimer} size="xs" onClick={onDelete} />
);

export type CarteDocumentActions = {
  edit?: () => void;
  replace?: () => void;
  comment?: () => void;
  delete?: () => void;
};

type MenuCarteDocumentProps = {
  document: Pick<Preuve, 'support'>;
  className?: string;
  actions: CarteDocumentActions;
};

const MenuCarteDocument = ({
  document,
  className,
  actions,
}: MenuCarteDocumentProps) => (
  <div className={classNames('flex gap-2', className)}>
    {actions.edit && (
      <EditDocumentButton document={document} onEdit={actions.edit} />
    )}
    {actions.replace && <ReplaceFileButton onReplace={actions.replace} />}
    {actions.comment && <CommentButton onComment={actions.comment} />}
    {actions.delete && <DeleteDocumentButton onDelete={actions.delete} />}
  </div>
);

export default MenuCarteDocument;
