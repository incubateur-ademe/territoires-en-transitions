import { createContext, useContext } from 'react';
import { DocumentCardAction } from './action';
import { EditHandlers, Preuve } from '../types';

export type DocumentCardContextValue = {
  document: Preuve;
  open: () => void;
  editComment: EditHandlers['editComment'];
  setOpenAction: (action: DocumentCardAction | null) => void;
};

const DocumentCardContext = createContext<DocumentCardContextValue | null>(
  null
);

export const DocumentCardProvider = DocumentCardContext.Provider;

export const useDocumentCard = (): DocumentCardContextValue => {
  const carteDocument = useContext(DocumentCardContext);
  if (!carteDocument) {
    throw new Error(
      'DocumentCard slots must be rendered inside a DocumentCard'
    );
  }
  return carteDocument;
};
