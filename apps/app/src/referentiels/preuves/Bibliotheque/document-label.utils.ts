import { appLabels } from '@/app/labels/catalog';
import { formatFileSize, getExtension } from '@/app/utils/file';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Preuve } from './types';

export const getFormattedTitle = (preuve: Preuve) => {
  const { fichier, lien } = preuve;
  if (fichier) {
    const { filename, filesize } = fichier;
    const extension = getExtension(filename)?.toUpperCase();
    const size = filesize !== undefined ? formatFileSize(filesize) : null;
    const details = [extension, size].filter(Boolean).join(', ');
    return details ? `${filename} (${details})` : filename;
  }
  if (lien) return lien.titre;
  return null;
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
