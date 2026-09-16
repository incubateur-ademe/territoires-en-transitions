import { createContext, useContext } from 'react';
import { CarteDocumentAction } from './carte-document-action';
import { EditHandlers, Preuve } from './types';

export type CarteDocumentContextValue = {
  document: Preuve;
  open: () => void;
  editComment: EditHandlers['editComment'];
  setOpenAction: (action: CarteDocumentAction | null) => void;
};

const CarteDocumentContext = createContext<CarteDocumentContextValue | null>(
  null
);

export const CarteDocumentProvider = CarteDocumentContext.Provider;

export const useCarteDocument = (): CarteDocumentContextValue => {
  const carteDocument = useContext(CarteDocumentContext);
  if (!carteDocument) {
    throw new Error(
      'CarteDocument slots must be rendered inside a CarteDocument'
    );
  }
  return carteDocument;
};
