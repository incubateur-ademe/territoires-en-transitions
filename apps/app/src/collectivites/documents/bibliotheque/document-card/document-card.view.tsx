import { appLabels } from '@/app/labels/catalog';
import { Card, Notification, Tooltip } from '@tet/ui';
import { ElementType, JSX, ReactNode, useState } from 'react';
import { getDocumentFichier } from '../to-document-collectivite.utils';
import { DocumentRattache } from '../types';
import { useEditState } from '../use-edit-state';
import { Actions, CommentAction, Delete, Edit, Replace } from './actions';
import {
  Author,
  CommentBlock,
  Duplicate,
  Identifier,
  Title,
  VisitDate,
} from './content';
import { DocumentCardProvider } from './context';
import { toDeclaredChildren } from './declared-children';
import { OpenedDocumentModal } from './opened-modal';

const CHILDREN = [Actions, Duplicate, Identifier];

const getVisitDate = (document: DocumentRattache): string | null =>
  document.preuveType === 'rapport' ? document.rapport.date : null;

type DocumentBadgeProps = {
  icon: 'error-warning-fill' | 'lock-fill';
  label: string;
  dataTest?: string;
};

const DocumentBadge = ({
  icon,
  label,
  dataTest,
}: DocumentBadgeProps): JSX.Element => (
  <Tooltip label={label}>
    <div data-test={dataTest} className="absolute -top-3 left-5">
      <Notification icon={icon} size="xs" classname="w-6 h-6" />
    </div>
  </Tooltip>
);

type DocumentCardViewProps = {
  document: DocumentRattache;
  onOpen: () => void;
  onSaveCommentaire: (commentaire: string) => void;
  onDelete: () => void;
  children?: ReactNode;
};

const DocumentCardViewRoot = ({
  document,
  onOpen,
  onSaveCommentaire,
  onDelete,
  children,
}: DocumentCardViewProps): JSX.Element | null => {
  const editComment = useEditState({
    initialValue: document.commentaire,
    onUpdate: onSaveCommentaire,
  });
  const [openedModal, setOpenedModal] = useState<OpenedDocumentModal | null>(
    null
  );

  const declaredChildren = toDeclaredChildren(children, {
    owner: 'DocumentCard',
    accepted: CHILDREN,
    label: 'its own actions and content',
  });
  const childOfType = (type: ElementType): ReactNode =>
    declaredChildren.find((child) => child.type === type);

  const fichier = getDocumentFichier(document);
  const visitDate = getVisitDate(document);

  if (document.type === 'nonRenseigne') return null;

  return (
    <DocumentCardProvider
      value={{ document, editComment, onDelete, openedModal, setOpenedModal }}
    >
      <div className="relative group max-w-screen-md" data-test="carte-doc">
        {document.type === 'fichierManquant' && (
          <DocumentBadge
            icon="error-warning-fill"
            label={appLabels.fichierIndisponibleInfo}
          />
        )}
        {fichier?.confidentiel && (
          <DocumentBadge
            icon="lock-fill"
            label={appLabels.fichierModePrive}
            dataTest="carte-doc-confidentiel"
          />
        )}
        {childOfType(Actions)}

        <Card className="p-4 h-full gap-1">
          <Title document={document} onOpen={onOpen} />
          {childOfType(Identifier)}
          <Author document={document} />
          {childOfType(Duplicate)}
          <CommentBlock
            commentaire={document.commentaire}
            editComment={editComment}
          />
          {visitDate && <VisitDate date={visitDate} />}
        </Card>
      </div>
    </DocumentCardProvider>
  );
};

export const documentCardSlots = {
  Actions,
  Comment: CommentAction,
  Delete,
  Duplicate,
  Edit,
  Identifier,
  Replace,
};

export const DocumentCardView = Object.assign(
  DocumentCardViewRoot,
  documentCardSlots
);
