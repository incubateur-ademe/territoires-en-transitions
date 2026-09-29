import { AddDocumentTabs } from '@/app/collectivites/documents/add-document/add-document.tabs';
import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';
import { JSX, useState } from 'react';
import { DeleteConfirmationAlert } from '../delete-confirmation.alert';
import { EditDocumentModal } from '../edit-document.modal';
import { DocumentRattache } from '../types';
import { useRemovePreuve } from '../use-edit-preuve';
import { EditState } from '../use-edit-state';
import { DocumentCardMenu } from './menu';
import { OpenedDocumentModal } from './opened-modal';

type ReplaceFichier = (fichierId: number) => Promise<void>;

export type DocumentCardActions = {
  edit?: boolean;
  comment?: boolean;
  remove?: boolean;
  replace?: ReplaceFichier;
};

const ReplaceModal = ({
  onReplace,
  onClose,
}: {
  onReplace: ReplaceFichier;
  onClose: () => void;
}): JSX.Element => (
  <Modal
    size="lg"
    openState={{ isOpen: true, setIsOpen: onClose }}
    title={appLabels.remplacerLeFichier}
    render={({ close }) => (
      <AddDocumentTabs onClose={close} handlers={{ addFile: onReplace }} />
    )}
  />
);

type ActionsProps = {
  document: DocumentRattache;
  actions: DocumentCardActions;
  editComment: EditState;
};

export const Actions = ({
  document,
  actions,
  editComment,
}: ActionsProps): JSX.Element => {
  const { mutate: removePreuve } = useRemovePreuve();
  const [openedModal, setOpenedModal] = useState<OpenedDocumentModal | null>(
    null
  );
  const closeModal = () => setOpenedModal(null);

  const editableDocument =
    document.type === 'fichier' || document.type === 'lien' ? document : null;

  const canEdit = actions.edit === true && editableDocument !== null;
  const hasMenuEntry =
    canEdit || actions.comment === true || actions.remove === true;
  const isReplaceOffered = actions.replace !== undefined;

  return (
    <>
      {(hasMenuEntry || isReplaceOffered) && !editComment.isEditing && (
        <DocumentCardMenu
          document={document}
          className="absolute top-4 right-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
          actions={{
            edit: canEdit ? () => setOpenedModal('edit') : undefined,
            comment: actions.comment ? () => editComment.enter() : undefined,
            replace: actions.replace
              ? () => setOpenedModal('replace')
              : undefined,
            remove: actions.remove ? () => setOpenedModal('delete') : undefined,
          }}
        />
      )}

      {openedModal === 'edit' && editableDocument !== null && (
        <EditDocumentModal
          isOpen
          setIsOpen={closeModal}
          document={editableDocument}
        />
      )}

      {openedModal === 'delete' && (
        <DeleteConfirmationAlert
          isOpen
          setIsOpen={closeModal}
          title={appLabels.supprimerDocument}
          message={appLabels.supprimerDocumentMessage}
          onDelete={() => removePreuve(document)}
        />
      )}

      {openedModal === 'replace' && actions.replace && (
        <ReplaceModal onReplace={actions.replace} onClose={closeModal} />
      )}
    </>
  );
};
