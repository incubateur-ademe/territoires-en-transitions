/** Renvoi une taille de fichier (en octet) formatée pour l'affichage */
export const formatFileSize = (size: number) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number((size / Math.pow(1024, i)).toFixed(2)) +
    ' ' +
    ['o', 'Ko', 'Mo', 'Go', 'To'][i]
  );
};

/** Renvoi l'extension d'un nom de fichier */
export const getExtension = (filename: string) => filename.split('.')?.pop();
