import { createContext, ReactNode, useContext, useState } from 'react';

export type ModalType =
  | 'emplacement'
  | 'export'
  | 'deleting'
  | 'accessRightsManagement'
  | 'activityLog'
  | 'pilotes'
  | 'status'
  | 'priority'
  | 'none';

type EditionModalManagerContextValue = {
  currentModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  isModalOpen: (modal: ModalType) => boolean;
};

const EditionModalManagerContext =
  createContext<EditionModalManagerContextValue | null>(null);

export const useEditionModalManager = () => {
  const context = useContext(EditionModalManagerContext);
  if (!context) {
    throw new Error(
      'useEditionModalManager must be used within EditionModalManagerProvider'
    );
  }
  return context;
};

export const EditionModalManagerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentModal, setCurrentModal] = useState<ModalType>('none');

  const openModal = (modal: ModalType) => setCurrentModal(modal);
  const closeModal = () => setCurrentModal('none');
  const isModalOpen = (modal: ModalType) => currentModal === modal;

  return (
    <EditionModalManagerContext.Provider
      value={{ currentModal, openModal, closeModal, isModalOpen }}
    >
      {children}
    </EditionModalManagerContext.Provider>
  );
};
