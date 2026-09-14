import { appLabels } from '@/app/labels/catalog';
import { formatFileSize, getExtension } from '@/app/utils/file';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Fichier, Preuve } from './types';

const getFichierTitle = ({ filename, filesize }: Fichier): string => {
  const extension = getExtension(filename)?.toUpperCase();
  const size = filesize === null ? null : formatFileSize(filesize);
  const details = [extension, size].filter(Boolean).join(', ');
  return details ? `${filename} (${details})` : filename;
};

export const getFormattedTitle = (preuve: Preuve): string | null => {
  switch (preuve.type) {
    case 'fichier':
      return getFichierTitle(preuve.fichier);
    case 'lien':
      return preuve.lien.titre;
    case 'fichierManquant':
      return preuve.filename;
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
