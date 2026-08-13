import { round } from 'es-toolkit';

/** Renvoi une taille de fichier (en octet) formatée pour l'affichage */
export const formatFileSize = (size: number) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number(round(size / Math.pow(1024, i), 2)) +
    ' ' +
    ['o', 'Ko', 'Mo', 'Go', 'To'][i]
  );
};

/**
 * Renvoie l'extension d'un nom de fichier, ou `undefined` s'il n'en a pas : un
 * nom sans point (« pdf ») ou commençant par un point (« .pdf ») n'a pas
 * d'extension, il ne faut pas prendre le nom entier pour telle.
 */
export const getExtension = (filename: string): string | undefined => {
  const separator = filename.lastIndexOf('.');
  if (separator <= 0 || separator === filename.length - 1) {
    return undefined;
  }
  return filename.slice(separator + 1);
};
