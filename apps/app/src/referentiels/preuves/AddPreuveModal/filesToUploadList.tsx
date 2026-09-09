import { DocumentHash } from '@tet/domain/collectivites';
import { FichierParHash, getFilesPerHash } from '../Bibliotheque/useFichiers';
import {
  DEFAULT_FILE_CONSTRAINTS,
  FileConstraints,
  keepWithinMaxFiles,
} from '../upload/constants';
import { hashFile } from '@/app/collectivites/documents/upload/hash-file.utils';
import { validateFile } from '../upload/validate-file';
import {
  UploadErrorCode,
  UploadStatusCode,
  UploadStatusDuplicated,
  UploadStatusFailed,
} from './types';

export type PreparedFile =
  | { kind: 'toUpload'; file: File; hash: DocumentHash }
  | {
      kind: 'settled';
      file: File;
      status: UploadStatusFailed | UploadStatusDuplicated;
    };

export const filesToUploadList = async (
  collectiviteId: number | null,
  files: FileList | null,
  constraints: FileConstraints = DEFAULT_FILE_CONSTRAINTS
): Promise<PreparedFile[]> => {
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
    filesToProcess.map(async (file: File) => ({
      file,
      hash: await hashFile(file),
    }))
  );

  // récupère la liste des éventuels doublons (fichiers déjà téléversés ayant la même clé)
  const hashes = filesWithHash.map(({ hash }) => hash);
  const duplicatedFiles = await getFilesPerHash(collectiviteId, hashes);

  return filesWithHash.map(({ file, hash }) => {
    // La validation précède la détection de doublon : un fichier déjà présent
    // dans la bibliothèque reste refusé s'il ne respecte pas les contraintes du
    // contexte de dépôt (le PDF seul pour un dossier PCAET, par exemple).
    const validationError = validateFile(file, constraints);
    if (validationError) {
      return toFailed(file, UploadErrorCode[validationError]);
    }

    const duplicatedFile = duplicatedFiles?.find((f) => f.hash === hash);
    if (duplicatedFile) {
      return toDuplicated(file, duplicatedFile);
    }
    return { kind: 'toUpload', file, hash };
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

const toFailed = (file: File, error: UploadErrorCode): PreparedFile => ({
  kind: 'settled',
  file,
  status: {
    code: UploadStatusCode.failed,
    error,
  },
});

const toDuplicated = (file: File, fichier: FichierParHash): PreparedFile => ({
  kind: 'settled',
  file,
  status: {
    code: UploadStatusCode.duplicated,
    fichier_id: fichier.id,
    filename: fichier.filename,
    hash: fichier.hash,
  },
});
