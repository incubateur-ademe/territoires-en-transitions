const RE_UTF8_FILENAME = /filename\*=UTF-8''(.*)/;
const RE_FILENAME = /filename="(.*)"/;

/** Essaye d'extraire un nom de fichier depuis les en-têtes d'une `Response` de
 * type `attachment` */
export const getFileNameFromResponse = (response: Response) => {
  // lit l'en-tête
  const contentDisposition = response.headers.get('content-disposition');
  return contentDisposition
    ? getFileNameFromString(contentDisposition)
    : undefined;
};

/** Essaye d'extraire un nom de fichier d'une chaîne de caractères (fournit par
 * l'en-tête `content-disposition`) */
export const getFileNameFromString = (contentDisposition: string) => {
  // sépare les différentes parties
  const parts = contentDisposition.split(';');

  if (!parts?.length) {
    return undefined;
  }

  // essaye de trouver un nom encodé en utf-8
  const index = parts.findIndex((s) => s.match(RE_UTF8_FILENAME));
  if (index !== -1) {
    const filename = parts[index].match(RE_UTF8_FILENAME)?.[1];
    if (filename) {
      // et le décode
      return decodeURIComponent(filename)?.normalize();
    }
  }

  // sinon essaye de trouver un nom sans encodage
  const index2 = parts.findIndex((s) => s.match(RE_FILENAME));
  if (index2 !== -1) {
    const filename = parts[index2].match(RE_FILENAME)?.[1];
    if (filename) {
      return decodeURIComponent(filename);
    }
  }
};
