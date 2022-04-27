import {FileObject} from '@supabase/storage-js';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {TFileItem} from './FileItem';
import {UploadStatusCode, UploadErrorCode} from './Uploader.d';
import {MAX_FILE_SIZE_BYTES, EXPECTED_FORMATS} from './constants';

/**
 * Transforme la sélection de fichiers en une liste d'items
 * pour l'onglet "Fichier" du dialogue "Ajouter une preuve"
 */
export const filesToUploadList = (
  action: ActionDefinitionSummary,
  files: FileList | null,
  bucketFiles: FileObject[]
): TFileItem[] => {
  if (!files) {
    return [];
  }

  return filesToArray(files).map((file: File) => {
    const duplicateErr = isDuplicate(file, bucketFiles);
    if (duplicateErr) {
      return createItemFailed(action, file, UploadErrorCode.duplicateError);
    }

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

// Transforme un objet FileList (retourné par le sélecteur de fichiers standard)
// en tableau. On le fait comme ça car TS n'accepte pas Array.from(files) ou [...files]
const filesToArray = (files: FileList): File[] => {
  const arr: File[] = [];
  for (let i = 0; i < files.length; i++) {
    arr.push(files.item(i) as File);
  }
  return arr;
};

// représente un fichier en erreur (pb de taille, de format, etc.)
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

// représente un fichier dont l'upload va démarrer
const createItemRunning = (
  action: ActionDefinitionSummary,
  file: File
): TFileItem => ({
  actionId: action.id,
  // normalise le nom du fichier pour contourner la limitation de storage-api
  // Ref: https://github.com/supabase/storage-api/issues/133
  file: normalizeFileName(file),
  status: {
    code: UploadStatusCode.running,
    progress: 0,
  },
});

// contrôle la taille d'un fichier
const isValidFileSize = (f: File): boolean => {
  return f.size < MAX_FILE_SIZE_BYTES;
};

// contrôle le format d'un fichier
const isValidFileFormat = (f: File): boolean => {
  const ext = f.name.split('.')?.pop();
  return (ext && EXPECTED_FORMATS.includes(ext)) || false;
};

// contrôle la présence d'un fichier portant le même nom dans le bucket
const isDuplicate = (f: File, bucketFiles: FileObject[]): boolean =>
  bucketFiles.findIndex(({name}) => name === f.name) !== -1;

// supprime les diacritiques du nom du fichier et renvoi un nouvel objet fichier
// ne fait rien si la fonction normalize n'est pas disponible (IE)
const normalizeFileName = (file: File): File =>
  typeof file.name.normalize === 'function'
    ? new File(
        [file],
        file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        {
          type: file.type,
        }
      )
    : file;
