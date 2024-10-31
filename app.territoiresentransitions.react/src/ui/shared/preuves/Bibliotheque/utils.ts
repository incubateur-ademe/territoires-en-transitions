import { TPreuve } from './types';
import { formatFileSize, getExtension } from 'utils/file';
import { getTextFormattedDate } from 'utils/formatUtils';

export const getFormattedTitle = (preuve: TPreuve) => {
  const { fichier, lien } = preuve;
  if (fichier) {
    const { filename, filesize } = fichier;
    return `${filename} (${getExtension(
      filename
    )?.toUpperCase()}, ${formatFileSize(filesize)})`;
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
