import { appLabels } from '@/app/labels/catalog';
import { formatFileSize, getExtension } from '@/app/utils/file';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Fichier, Preuve } from './types';

const getFichierTitle = ({ filename, filesize }: Fichier): string => {
  const extension = getExtension(filename)?.toUpperCase();
  const size = filesize !== undefined ? formatFileSize(filesize) : null;
  const details = [extension, size].filter(Boolean).join(', ');
  return details ? `${filename} (${details})` : filename;
};

export const getFormattedTitle = ({ support }: Preuve): string | null => {
  switch (support.type) {
    case 'fichier':
      return getFichierTitle(support.fichier);
    case 'lien':
      return support.lien.titre;
    case 'fichierManquant':
      return support.filename;
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
