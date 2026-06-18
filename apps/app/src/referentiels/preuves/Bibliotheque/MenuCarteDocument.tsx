import classNames from 'classnames';
import { CommentAction } from './CommentAction';
import { DeleteDocumentAction } from './DeleteDocumentAction';
import { EditDocumentAction } from './EditDocumentAction';
import { ReplaceFileAction } from './ReplaceFileAction';
import { TPreuve } from './types';

export type CarteDocumentActions = {
  comment?: () => void;
  delete?: () => void;
  replace?: (fichierId: number) => Promise<void>;
};

type MenuCarteDocumentProps = {
  document: Pick<
    TPreuve,
    'id' | 'fichier' | 'lien' | 'collectivite_id' | 'preuve_type'
  >;
  className?: string;
  actions: CarteDocumentActions;
};

const MenuCarteDocument = ({
  document,
  className,
  actions,
}: MenuCarteDocumentProps) => (
  <div className={classNames('flex gap-2', className)}>
    <EditDocumentAction document={document} />
    {actions.replace && <ReplaceFileAction onReplace={actions.replace} />}
    {actions.comment && <CommentAction onComment={actions.comment} />}
    {actions.delete && <DeleteDocumentAction onDelete={actions.delete} />}
  </div>
);

export default MenuCarteDocument;
