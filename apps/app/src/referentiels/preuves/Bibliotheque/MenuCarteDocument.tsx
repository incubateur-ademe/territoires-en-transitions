import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Button } from '@tet/ui';
import classNames from 'classnames';
import { TPreuve } from './types';

const EditDocumentButton = ({
  document,
  onEdit,
}: {
  document: Pick<TPreuve, 'fichier'>;
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

const ReclassifyDocumentButton = ({
  onReclassify,
}: {
  onReclassify: () => void;
}) => (
  <Button
    title={appLabels.reclasserDocument}
    icon="price-tag-3-line"
    variant="grey"
    size="xs"
    onClick={onReclassify}
  />
);

export type CarteDocumentActions = {
  edit?: () => void;
  replace?: () => void;
  comment?: () => void;
  reclassify?: () => void;
  delete?: () => void;
};

type MenuCarteDocumentProps = {
  document: Pick<TPreuve, 'fichier'>;
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
    {actions.reclassify && (
      <ReclassifyDocumentButton onReclassify={actions.reclassify} />
    )}
    {actions.delete && <DeleteDocumentButton onDelete={actions.delete} />}
  </div>
);

export default MenuCarteDocument;
