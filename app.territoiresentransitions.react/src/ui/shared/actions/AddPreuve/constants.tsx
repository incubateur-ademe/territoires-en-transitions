import {TFileItem} from './FileItem';
import {UploadStatusCode, UploadErrorCode} from './Uploader.d';

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
const filesToArray = (files: FileList): Array<File> => {
  const arr: Array<File> = [];
  for (let i = 0; i < files.length; i++) {
    arr.push(files.item(i) as File);
  }
  return arr;
};

const createItemFailed = (file: File, error: UploadErrorCode): TFileItem => ({
  file,
  status: {
    code: UploadStatusCode.failed,
    error,
  },
});

const createItemRunning = (file: File): TFileItem => ({
  file,
  status: {
    code: UploadStatusCode.running,
    progress: 0,
  },
});

export const filesToSelection = (files: FileList | null): Array<TFileItem> => {
  if (!files) {
    return [];
  }

  return filesToArray(files).map((file: File) => {
    const sizeErr = !isValidFileSize(file);
    const formatErr = !isValidFileFormat(file);
    if (formatErr && sizeErr) {
      return createItemFailed(file, UploadErrorCode.formatAndSizeError);
    }
    if (formatErr) {
      return createItemFailed(file, UploadErrorCode.formatError);
    }
    if (sizeErr) {
      return createItemFailed(file, UploadErrorCode.sizeError);
    }
    return createItemRunning(file);
  });
};

export const isValidFileSize = (f: File): boolean => {
  return f.size < MAX_FILE_SIZE_BYTES;
};

const isValidFileFormat = (f: File): boolean => {
  const ext = f.name.split('.')?.pop();
  return (ext && EXPECTED_FORMATS.includes(ext)) || false;
};
