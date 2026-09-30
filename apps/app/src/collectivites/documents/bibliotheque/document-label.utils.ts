import { appLabels } from '@/app/labels/catalog';
import { formatFileSize, getExtension } from '@/app/utils/file';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { DocumentSupport, StoredFile } from '@tet/domain/collectivites';

export type DocumentTitleOptions = {
  withExtension?: boolean;
  withFilesize?: boolean;
};

const getFichierTitle = (
  { filename, filesize }: StoredFile,
  { withExtension, withFilesize }: DocumentTitleOptions
): string => {
  const extension = withExtension
    ? getExtension(filename)?.toUpperCase()
    : null;
  const size =
    withFilesize && filesize !== null ? formatFileSize(filesize) : null;
  const details = [extension, size].filter(Boolean).join(', ');
  return details ? `${filename} (${details})` : filename;
};

export const getDocumentTitle = (
  document: DocumentSupport,
  options: DocumentTitleOptions = {}
): string | null => {
  switch (document.type) {
    case 'fichier':
      return getFichierTitle(document.fichier, options);
    case 'lien':
      return document.lien.titre;
    case 'fichierManquant':
      return document.filename;
    case 'nonRenseigne':
      return null;
  }
};

export const getAuthorAndDate = (
  date: string | null,
  author: string | null
): string | null => {
  if (!date && !author) {
    return null;
  }

  return appLabels.documentDerniereModification({
    date: date ? getTextFormattedDate({ date, shortMonth: true }) : undefined,
    auteur: author ?? undefined,
  });
};
