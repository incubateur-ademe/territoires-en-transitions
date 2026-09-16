import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Button } from '@tet/ui';
import classNames from 'classnames';
import { Preuve } from '../types';

const EditDocumentButton = ({
  document,
  onEdit,
}: {
  document: Pick<Preuve, 'fichier'>;
  onEdit: () => void;
}) => (
  <Button
    icon="edit-line"
    title={document.fichier ? appLabels.editerDocument : appLabels.editerLien}
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

type DocumentCardActions = {
  edit?: () => void;
  replace?: () => void;
  comment?: () => void;
  delete?: () => void;
};

type DocumentCardMenuProps = {
  document: Pick<Preuve, 'fichier'>;
  className?: string;
  actions: DocumentCardActions;
};

export const DocumentCardMenu = ({
  document,
  className,
  actions,
}: DocumentCardMenuProps) => (
  <div className={classNames('flex gap-2', className)}>
    {actions.edit && (
      <EditDocumentButton document={document} onEdit={actions.edit} />
    )}
    {actions.replace && <ReplaceFileButton onReplace={actions.replace} />}
    {actions.comment && <CommentButton onComment={actions.comment} />}
    {actions.delete && <DeleteDocumentButton onDelete={actions.delete} />}
  </div>
);
