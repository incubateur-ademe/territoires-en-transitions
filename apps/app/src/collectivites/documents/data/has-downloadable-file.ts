import { MesureDocumentsState } from './use-list-documents-mesure';

export const hasDownloadableFile = (
  documents: MesureDocumentsState
): boolean => {
  if (documents.status !== 'loaded') {
    return false;
  }

  return [
    ...documents.attendus.flatMap((attendu) => attendu.documents),
    ...documents.complementaires,
  ].some((document) => document.type === 'fichier');
};
