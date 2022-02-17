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

// transforme un objet FileList en tableau
export const filesToArray = (files: FileList | null): Array<File> => {
  if (!files) {
    return [];
  }

  const arr: Array<File> = [];
  for (let i = 0; i < files.length; i++) {
    arr.push(files.item(i) as File);
  }
  return arr;
};

export type TFilesArrayOrNull = Array<File> | null;

export const isValidFile = (f: File) => {
  const ext = f.name.split('.')?.pop();
  return ext && EXPECTED_FORMATS.includes(ext) && f.size < MAX_FILE_SIZE_BYTES;
};

// renvoi la liste des fichiers non valides (format non supporté ou poids trop
// important)
export const getInvalidFiles = (files: TFilesArrayOrNull): TFilesArrayOrNull =>
  files ? files.filter(f => !isValidFile(f)) : null;

// et l'inverse
export const getValidFiles = (files: TFilesArrayOrNull): TFilesArrayOrNull =>
  files ? files.filter(isValidFile) : null;
