import { formatFileSize, getExtension } from '@/app/utils/file';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { TPreuve } from './types';

export const getFormattedTitle = (preuve: TPreuve) => {
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
) => {
  const formattedDate = date
    ? getTextFormattedDate({ date: date, shortMonth: true })
    : null;

  if (date || author) {
    return `Ajouté${date ? ` le ${formattedDate}` : ''}${
      author ? ` par ${author}` : ''
    }`;
  }
  return null;
};
