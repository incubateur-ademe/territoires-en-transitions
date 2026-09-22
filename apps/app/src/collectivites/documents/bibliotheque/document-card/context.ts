import { createContext, useContext } from 'react';
import { DocumentRattache } from '../types';
import { EditState } from '../use-edit-state';
import { OpenedDocumentModal } from './opened-modal';

export type DocumentCardContextValue = {
  document: DocumentRattache;
  editComment: EditState;
  openedModal: OpenedDocumentModal | null;
  setOpenedModal: (modal: OpenedDocumentModal | null) => void;
};

const DocumentCardContext = createContext<DocumentCardContextValue | null>(
  null
);

export const DocumentCardProvider = DocumentCardContext.Provider;

export const useDocumentCard = (): DocumentCardContextValue => {
  const documentCard = useContext(DocumentCardContext);
  if (!documentCard) {
    throw new Error(
      'DocumentCard actions must be rendered inside a DocumentCard'
    );
  }
  return documentCard;
};
