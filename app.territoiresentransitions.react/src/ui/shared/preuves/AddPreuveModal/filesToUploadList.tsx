import {TFileItem} from './FileItem';
import {UploadStatusCode, UploadErrorCode} from './types';
import {MAX_FILE_SIZE_BYTES, EXPECTED_FORMATS} from './constants';
import {getExtension} from 'utils/file';
import {TBibliothequeFichier} from '../Bibliotheque/types';
import {shasum256} from 'utils/shasum256';

/**
 * Transforme la sélection de fichiers en une liste d'items
 * pour l'onglet "Fichier" du dialogue "Ajouter une preuve"
 */
export const filesToUploadList = async (
  files: FileList | null,
  fichiers: TBibliothequeFichier[]
): Promise<TFileItem[]> => {
  if (!files) {
    return [];
  }

  return Promise.all(
    filesToArray(files).map(async (file: File) => {
      const hash = await shasum256(file);
      const duplicatedFile = getFileFromLib(hash, fichiers);
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
    })
  );
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

// contrôle la présence d'un fichier portant le même nom dans le bucket et
// renvoi ses informations, si il existe ou sinon `false`
const getFileFromLib = (
  hash: string,
  fichiers: TBibliothequeFichier[]
): TBibliothequeFichier | false => {
  const fichier = fichiers.find(({hash: h}) => hash === h);
  return fichier || false;
};
