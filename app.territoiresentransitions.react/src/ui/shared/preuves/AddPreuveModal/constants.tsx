// poids max en Mo et en octets pour un fichier
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// formats attendus
export const EXPECTED_FORMATS = [
  'pdf',
  'doc',
  'docx',
  'odt',
  'ods',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jpeg',
  'jpg',
  'png',
];

// liste des extensions acceptées sous forme de chaîne
export const EXPECTED_FORMATS_LIST = EXPECTED_FORMATS.map(
  ext => `.${ext}`
).join(',');

// message d'aide pour le sélecteur de fichiers
export const HINT = `Taille maximale par fichier : ${MAX_FILE_SIZE_MB} Mo.\
  Formats supportés : ${EXPECTED_FORMATS.join(', ')}.`;
