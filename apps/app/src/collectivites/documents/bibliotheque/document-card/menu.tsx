import { DocumentCollectivite } from '@tet/domain/collectivites';
import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Button } from '@tet/ui';
import classNames from 'classnames';
import { DocumentRattache } from '../types';

const EditDocumentButton = ({
  document,
  onEdit,
}: {
  document: DocumentCollectivite & Pick<DocumentRattache, 'preuveType'>;
  onEdit: () => void;
}) => {
  const title =
    document.type === 'lien' ? appLabels.editerLien : appLabels.editerDocument;
  return (
    <Button
      icon="edit-line"
      title={title}
      variant="grey"
      size="xs"
      onClick={onEdit}
    />
  );
};

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
  document: DocumentCollectivite & Pick<DocumentRattache, 'preuveType'>;
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
