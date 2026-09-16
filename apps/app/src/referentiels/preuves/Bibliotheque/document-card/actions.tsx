import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Modal, VisibleWhen } from '@tet/ui';
import { ElementType, JSX, ReactNode } from 'react';
import { DeleteConfirmationAlert } from '../delete-confirmation.alert';
import { EditDocumentModal } from '../edit-document.modal';
import { useRemovePreuve } from '../use-edit-preuve';
import { useDocumentCard } from './context';
import { toDeclaredChildren } from './declared-children';
import { DocumentCardMenu } from './menu';

export const Edit = (): JSX.Element => {
  const { document, openedModal, setOpenedModal } = useDocumentCard();
  const isOpen = openedModal === 'edit';

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

export const CommentAction = (): null => {
  useDocumentCard();
  return null;
};

export const Delete = (): JSX.Element => {
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
}: {
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
          <AddPreuveModal
            onClose={close}
            handlers={{ addFileFromLib: onReplace }}
          />
        )}
      />
    </VisibleWhen>
  );
};

const ACTIONS = [Edit, CommentAction, Delete, Replace];

export const Actions = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element | null => {
  const { document, editComment, setOpenedModal } = useDocumentCard();
  const declaredActions = toDeclaredChildren(children, {
    owner: 'DocumentCard.Actions',
    accepted: ACTIONS,
    label: 'its own actions',
  }).map((action) => action.type);
  const isDeclared = (action: ElementType): boolean =>
    declaredActions.includes(action);

  const menuActions = {
    edit: isDeclared(Edit) ? () => setOpenedModal('edit') : undefined,
    comment: isDeclared(CommentAction) ? () => editComment.enter() : undefined,
    replace: isDeclared(Replace) ? () => setOpenedModal('replace') : undefined,
    delete: isDeclared(Delete) ? () => setOpenedModal('delete') : undefined,
  };
  const hasDeclaredAction = declaredActions.length > 0;
  const isMenuShown = hasDeclaredAction && !editComment.isEditing;

  return (
    <>
      {isMenuShown && (
        <DocumentCardMenu
          document={document}
          className="absolute top-4 right-4 invisible group-hover:visible"
          actions={menuActions}
        />
      )}
      {children}
    </>
  );
};

Edit.displayName = 'DocumentCard.Edit';
CommentAction.displayName = 'DocumentCard.Comment';
Delete.displayName = 'DocumentCard.Delete';
Replace.displayName = 'DocumentCard.Replace';
Actions.displayName = 'DocumentCard.Actions';
