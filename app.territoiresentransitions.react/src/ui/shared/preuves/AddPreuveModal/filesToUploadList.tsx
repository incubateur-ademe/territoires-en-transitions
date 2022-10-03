import {TFileItem} from './FileItem';
import {UploadStatusCode, UploadErrorCode} from './types';
import {MAX_FILE_SIZE_BYTES, EXPECTED_FORMATS} from './constants';
import {getExtension} from 'utils/file';
import {TBibliothequeFichier} from '../Bibliotheque/types';
import {shasum256} from 'utils/shasum256';
import {getFilesPerHash} from '../Bibliotheque/useFichiers';

/**
 * Transforme la sélection de fichiers en une liste d'items
 * pour l'onglet "Fichier" du dialogue "Ajouter une preuve"
 */
export const filesToUploadList = async (
  collectivite_id: number | null,
  files: FileList | null
): Promise<TFileItem[]> => {
  if (!files || !collectivite_id) {
    return [];
  }

  // détermine la clé de chaque fichier
  const filesWithHash = await Promise.all(
    filesToArray(files).map(async (file: File) => {
      const hash = await shasum256(file);
      return {file, hash};
    })
  );

  // récupère la liste des éventuels doublons (fichiers déjà téléversés ayant la même clé)
  const hashes = filesWithHash.map(({hash}) => hash);
  const duplicatedFiles = await getFilesPerHash(collectivite_id, hashes);

  return filesWithHash.map(({file, hash}: {file: File; hash: string}) => {
    const duplicatedFile = duplicatedFiles?.find(f => f.hash === hash);
    if (duplicatedFile) {
      return createItemDuplicated(file, duplicatedFile);
    }

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

// représente un fichier déjà téléversé
const createItemDuplicated = (
  file: File,
  fichier: TBibliothequeFichier
): TFileItem => ({
  file,
  status: {
    code: UploadStatusCode.duplicated,
    fichier_id: fichier.id,
    filename: fichier.filename,
  },
});

// représente un fichier dont l'upload va démarrer
const createItemRunning = (file: File): TFileItem => ({
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
  const ext = getExtension(f.name);
  return (ext && EXPECTED_FORMATS.includes(ext.toLowerCase())) || false;
};
