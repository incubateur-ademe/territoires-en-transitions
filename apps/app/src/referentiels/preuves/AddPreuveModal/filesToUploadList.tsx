import { shasum256 } from '@/app/utils/shasum256';
import { FichierParHash, getFilesPerHash } from '../Bibliotheque/useFichiers';
import {
  DEFAULT_FILE_CONSTRAINTS,
  FileConstraints,
  keepWithinMaxFiles,
} from '../upload/constants';
import { validateFile } from '../upload/validate-file';
import { FileUploadItem } from './FileItem';
import { UploadErrorCode, UploadStatusCode } from './types';

/**
 * Transforme la sélection de fichiers en une liste d'items
 * pour l'onglet "Fichier" du dialogue "Ajouter une preuve"
 */
export const filesToUploadList = async (
  collectiviteId: number | null,
  files: FileList | null,
  constraints: FileConstraints = DEFAULT_FILE_CONSTRAINTS
): Promise<FileUploadItem[]> => {
  if (!files || !collectiviteId) {
    return [];
  }

  // La limite du contexte s'applique avant le hachage : un glisser-déposer de
  // trente fichiers pour un contexte qui n'en accepte qu'un ne doit pas les
  // hacher tous ni les chercher tous dans la bibliothèque.
  const filesToProcess = keepWithinMaxFiles(
    filesToArray(files),
    constraints.maxFiles
  );

  // détermine la clé de chaque fichier
  const filesWithHash = await Promise.all(
    filesToProcess.map(async (file: File) => {
      const hash = await shasum256(file);
      return { file, hash };
    })
  );

  // récupère la liste des éventuels doublons (fichiers déjà téléversés ayant la même clé)
  const hashes = filesWithHash.map(({ hash }) => hash);
  const duplicatedFiles = await getFilesPerHash(collectiviteId, hashes);

  return filesWithHash.map(({ file, hash }: { file: File; hash: string }) => {
    // La validation précède la détection de doublon : un fichier déjà présent
    // dans la bibliothèque reste refusé s'il ne respecte pas les contraintes du
    // contexte de dépôt (le PDF seul pour un dossier PCAET, par exemple).
    const validationError = validateFile(file, constraints);
    if (validationError) {
      return createItemFailed(file, UploadErrorCode[validationError]);
    }

    const duplicatedFile = duplicatedFiles?.find((f) => f.hash === hash);
    if (duplicatedFile) {
      return createItemDuplicated(file, duplicatedFile);
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
const createItemFailed = (
  file: File,
  error: UploadErrorCode
): FileUploadItem => ({
  file,
  status: {
    code: UploadStatusCode.failed,
    error,
  },
});

// représente un fichier déjà téléversé
const createItemDuplicated = (
  file: File,
  fichier: FichierParHash
): FileUploadItem => ({
  file,
  status: {
    code: UploadStatusCode.duplicated,
    fichier_id: fichier.id,
    filename: fichier.filename,
    hash: fichier.hash,
  },
});

// représente un fichier dont l'upload va démarrer
const createItemRunning = (file: File): FileUploadItem => ({
  file,
  status: {
    code: UploadStatusCode.running,
    progress: 0,
  },
});
