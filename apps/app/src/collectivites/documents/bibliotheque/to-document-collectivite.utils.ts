import {
  DocumentCollectivite,
  DocumentCollectiviteBase,
  Lien,
  StoredFile,
} from '@tet/domain/collectivites';

export type DocumentLegacy = DocumentCollectiviteBase & {
  fichier: StoredFile | null;
  lien: Lien | null;
};

export const toDocumentCollectivite = ({
  fichier,
  lien,
  ...base
}: DocumentLegacy): DocumentCollectivite => {
  if (fichier) {
    return { ...base, type: 'fichier', fichier };
  }
  if (lien) {
    return { ...base, type: 'lien', lien };
  }
  return { ...base, type: 'nonRenseigne' };
};

export const getDocumentFichier = (
  document: DocumentCollectivite
): StoredFile | null => (document.type === 'fichier' ? document.fichier : null);

export const getDocumentLien = (document: DocumentCollectivite): Lien | null =>
  document.type === 'lien' ? document.lien : null;
