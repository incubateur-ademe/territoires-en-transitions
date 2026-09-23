import { appLabels } from '@/app/labels/catalog';
import { AddDocumentTabs } from '@/app/collectivites/documents/add-document/add-document.tabs';
import { Modal, VisibleWhen } from '@tet/ui';
import { ElementType, JSX, ReactNode } from 'react';
import { DeleteConfirmationAlert } from '../delete-confirmation.alert';
import { EditDocumentModal } from '../edit-document.modal';
import { useRemovePreuve } from '../use-edit-preuve';
import { useDocumentCard } from './context';
import { toDeclaredChildren } from './declared-children';
import { DocumentCardMenu } from './menu';

export type ActionVisibility = { visibleWhen?: boolean };

export const Edit = (_props: ActionVisibility): JSX.Element | null => {
  const { document, openedModal, setOpenedModal } = useDocumentCard();
  const isOpen = openedModal === 'edit';

  if (document.type === 'fichierManquant' || document.type === 'nonRenseigne') {
    return null;
  }

  return (
    <VisibleWhen condition={isOpen}>
      <EditDocumentModal
        isOpen={isOpen}
        setIsOpen={() => setOpenedModal(null)}
        document={document}
      />
    </VisibleWhen>
  );
};

export const CommentAction = (_props: ActionVisibility): null => {
  useDocumentCard();
  return null;
};

export const Delete = (_props: ActionVisibility): JSX.Element => {
  const { document, openedModal, setOpenedModal } = useDocumentCard();
  const { mutate: removePreuve } = useRemovePreuve();
  const isOpen = openedModal === 'delete';

  return (
    <VisibleWhen condition={isOpen}>
      <DeleteConfirmationAlert
        isOpen={isOpen}
        setIsOpen={() => setOpenedModal(null)}
        title={appLabels.supprimerDocument}
        message={appLabels.supprimerDocumentMessage}
        onDelete={() => removePreuve(document)}
      />
    </VisibleWhen>
  );
};

export const Replace = ({
  onReplace,
}: ActionVisibility & {
  onReplace: (fichierId: number) => Promise<void>;
}): JSX.Element => {
  const { openedModal, setOpenedModal } = useDocumentCard();
  const isOpen = openedModal === 'replace';

  return (
    <VisibleWhen condition={isOpen}>
      <Modal
        size="lg"
        openState={{
          isOpen,
          setIsOpen: () => setOpenedModal(null),
        }}
        title={appLabels.remplacerLeFichier}
        render={({ close }) => (
          <AddDocumentTabs onClose={close} handlers={{ addFile: onReplace }} />
        )}
      />
    </VisibleWhen>
  );
};

const ACTIONS = [Edit, CommentAction, Delete, Replace];

export const Actions = ({
  children,
  visibleWhen = true,
}: ActionVisibility & {
  children: ReactNode;
}): JSX.Element | null => {
  const { document, editComment, setOpenedModal } = useDocumentCard();
  const isFichierManquant = document.type === 'fichierManquant';
  const visibleActions = toDeclaredChildren(children, {
    owner: 'DocumentCard.Actions',
    accepted: ACTIONS,
    label: 'its own actions',
  })
    .filter((action) => action.props.visibleWhen !== false)
    .filter((action) => !(isFichierManquant && action.type === Edit));
  const declaredActions = visibleActions.map((action) => action.type);
  const isDeclared = (action: ElementType): boolean =>
    declaredActions.includes(action);

  const menuActions = {
    edit: isDeclared(Edit) ? () => setOpenedModal('edit') : undefined,
    comment: isDeclared(CommentAction) ? () => editComment.enter() : undefined,
    replace: isDeclared(Replace) ? () => setOpenedModal('replace') : undefined,
    delete: isDeclared(Delete) ? () => setOpenedModal('delete') : undefined,
  };
  const hasVisibleAction = declaredActions.length > 0;
  const isMenuShown = hasVisibleAction && !editComment.isEditing;

  if (!visibleWhen) {
    return null;
  }

  return (
    <>
      {isMenuShown && (
        <DocumentCardMenu
          document={document}
          className="absolute top-4 right-4 invisible group-hover:visible"
          actions={menuActions}
        />
      )}
      {visibleActions}
    </>
  );
};

Edit.displayName = 'DocumentCard.Edit';
CommentAction.displayName = 'DocumentCard.Comment';
Delete.displayName = 'DocumentCard.Delete';
Replace.displayName = 'DocumentCard.Replace';
Actions.displayName = 'DocumentCard.Actions';
