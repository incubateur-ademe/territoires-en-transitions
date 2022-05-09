import {FileObject} from '@supabase/storage-js';
import {TFileItem} from './FileItem';
import {UploadStatusCode, UploadErrorCode} from './types';
import {MAX_FILE_SIZE_BYTES, EXPECTED_FORMATS} from './constants';

/**
 * Transforme la sélection de fichiers en une liste d'items
 * pour l'onglet "Fichier" du dialogue "Ajouter une preuve"
 */
export const filesToUploadList = (
  files: FileList | null,
  bucketFiles: FileObject[]
): TFileItem[] => {
  if (!files) {
    return [];
  }

  return filesToArray(files).map((file: File) => {
    const normalizedFile = normalizeFileName(file);
    const duplicateErr = isDuplicate(normalizedFile, bucketFiles);
    if (duplicateErr) {
      return createItemFailed(normalizedFile, UploadErrorCode.duplicateError);
    }

    const sizeErr = !isValidFileSize(normalizedFile);
    const formatErr = !isValidFileFormat(normalizedFile);
    if (formatErr && sizeErr) {
      return createItemFailed(
        normalizedFile,
        UploadErrorCode.formatAndSizeError
      );
    }
    if (formatErr) {
      return createItemFailed(normalizedFile, UploadErrorCode.formatError);
    }
    if (sizeErr) {
      return createItemFailed(normalizedFile, UploadErrorCode.sizeError);
    }
    return createItemRunning(normalizedFile);
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
const createItemFailed = (file: File, error: UploadErrorCode): TFileItem => ({
  file,
  status: {
    code: UploadStatusCode.failed,
    error,
  },
});

// représente un fichier dont l'upload va démarrer
const createItemRunning = (file: File): TFileItem => ({
  // normalise le nom du fichier pour contourner la limitation de storage-api
  // Ref: https://github.com/supabase/storage-api/issues/133
  file,
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
  return (ext && EXPECTED_FORMATS.includes(ext.toLowerCase())) || false;
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
