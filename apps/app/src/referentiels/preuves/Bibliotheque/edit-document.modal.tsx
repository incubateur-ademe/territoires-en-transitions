import { EditFichierModal } from './edit-fichier.modal';
import { EditLienModal } from './edit-lien.modal';
import { Preuve } from './types';

export type EditDocumentModalProps = {
  document: Preuve;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export const EditDocumentModal = ({
  document,
  isOpen,
  setIsOpen,
}: EditDocumentModalProps) =>
  document.fichier ? (
    <EditFichierModal isOpen={isOpen} setIsOpen={setIsOpen} preuve={document} />
  ) : (
    <EditLienModal isOpen={isOpen} setIsOpen={setIsOpen} preuve={document} />
  );
