import {
  DocumentCollectivite,
  DocumentCollectiviteBase,
  Lien,
} from '@tet/domain/collectivites';
import { Fichier } from './types';

export const toDocumentCollectivite = ({
  fichier,
  lien,
  ...base
}: DocumentCollectiviteBase & {
  fichier: Fichier | null;
  lien: Lien | null;
}): DocumentCollectivite => {
  if (fichier) {
    return { ...base, type: 'fichier', fichier };
  }
  if (lien) {
    return { ...base, type: 'lien', lien };
  }
  return { ...base, type: 'nonRenseigne' };
};

export const getPreuveFichier = (
  preuve: DocumentCollectivite
): Fichier | null => (preuve.type === 'fichier' ? preuve.fichier : null);

export const getPreuveLien = (preuve: DocumentCollectivite): Lien | null =>
  preuve.type === 'lien' ? preuve.lien : null;
