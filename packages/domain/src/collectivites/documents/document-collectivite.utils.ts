import { DocumentSupport, StoredFile } from './document-collectivite.schema';
import { Lien } from './document-lien.schema';

export const toFichier = <Base extends object>(
  document: Base & { fichier: StoredFile }
): Base & Extract<DocumentSupport, { type: 'fichier' }> => ({
  ...document,
  type: 'fichier',
});

export const toLien = <Base extends object>(
  document: Base & { lien: Lien }
): Base & Extract<DocumentSupport, { type: 'lien' }> => ({
  ...document,
  type: 'lien',
});

export const toFichierManquant = <Base extends object>(
  document: Base & { filename: string }
): Base & Extract<DocumentSupport, { type: 'fichierManquant' }> => ({
  ...document,
  type: 'fichierManquant',
});
