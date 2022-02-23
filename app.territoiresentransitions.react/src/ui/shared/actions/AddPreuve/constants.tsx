import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
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

const createItemFailed = (
  action: ActionDefinitionSummary,
  file: File,
  error: UploadErrorCode
): TFileItem => ({
  actionId: action.id,
  file,
  status: {
    code: UploadStatusCode.failed,
    error,
  },
});

const createItemRunning = (
  action: ActionDefinitionSummary,
  file: File
): TFileItem => ({
  actionId: action.id,
  file,
  status: {
    code: UploadStatusCode.running,
    progress: 0,
  },
});

export const filesToSelection = (
  action: ActionDefinitionSummary,
  files: FileList | null
): Array<TFileItem> => {
  if (!files) {
    return [];
  }

  return filesToArray(files).map((file: File) => {
    const sizeErr = !isValidFileSize(file);
    const formatErr = !isValidFileFormat(file);
    if (formatErr && sizeErr) {
      return createItemFailed(action, file, UploadErrorCode.formatAndSizeError);
    }
    if (formatErr) {
      return createItemFailed(action, file, UploadErrorCode.formatError);
    }
    if (sizeErr) {
      return createItemFailed(action, file, UploadErrorCode.sizeError);
    }
    return createItemRunning(action, file);
  });
};

export const isValidFileSize = (f: File): boolean => {
  return f.size < MAX_FILE_SIZE_BYTES;
};

const isValidFileFormat = (f: File): boolean => {
  const ext = f.name.split('.')?.pop();
  return (ext && EXPECTED_FORMATS.includes(ext)) || false;
};
