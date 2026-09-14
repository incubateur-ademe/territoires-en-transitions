import { DocumentCollectivite } from '@tet/domain/collectivites';
import { EditFichierModal } from './edit-fichier.modal';
import { EditLienModal } from './edit-lien.modal';
import { Preuve } from './types';

export type DocumentModifiable = Pick<
  Preuve,
  'id' | 'collectiviteId' | 'preuveType'
> &
  Extract<DocumentCollectivite, { type: 'fichier' | 'lien' }>;

export type EditDocumentModalProps = {
  document: DocumentModifiable;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export const EditDocumentModal = ({
  document,
  isOpen,
  setIsOpen,
}: EditDocumentModalProps) => {
  if (document.type === 'lien') {
    return (
      <EditLienModal isOpen={isOpen} setIsOpen={setIsOpen} preuve={document} />
    );
  }

  return (
    <EditFichierModal isOpen={isOpen} setIsOpen={setIsOpen} preuve={document} />
  );
};
