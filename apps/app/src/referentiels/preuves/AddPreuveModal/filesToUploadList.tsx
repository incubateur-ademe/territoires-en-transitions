import { DocumentHash } from '@tet/domain/collectivites';
import {
  DEFAULT_FILE_CONSTRAINTS,
  FileConstraints,
  keepWithinMaxFiles,
} from '../upload/constants';
import { hashFile } from '@/app/collectivites/documents/upload/hash-file.utils';
import { validateFile } from '../upload/validate-file';
import { UploadErrorCode, UploadStatusCode, UploadStatusFailed } from './types';

export type PreparedFile =
  | { kind: 'toUpload'; file: File; hash: DocumentHash }
  | { kind: 'rejected'; file: File; status: UploadStatusFailed };

export const filesToUploadList = async (
  files: ArrayLike<File>,
  constraints: FileConstraints = DEFAULT_FILE_CONSTRAINTS
): Promise<PreparedFile[]> => {
  // La limite du contexte s'applique avant le hachage : un glisser-déposer de
  // trente fichiers pour un contexte qui n'en accepte qu'un ne doit pas les
  // hacher tous.
  const filesToProcess = keepWithinMaxFiles(
    Array.from(files),
    constraints.maxFiles
  );

  // détermine la clé de chaque fichier
  const filesWithHash = await Promise.all(
    filesToProcess.map(async (file: File) => ({
      file,
      hash: await hashFile(file),
    }))
  );

  return filesWithHash.map(({ file, hash }) => {
    const validationError = validateFile(file, constraints);
    if (validationError) {
      return toRejected(file, UploadErrorCode[validationError]);
    }
    return { kind: 'toUpload', file, hash };
  });
};

const toRejected = (file: File, error: UploadErrorCode): PreparedFile => ({
  kind: 'rejected',
  file,
  status: {
    code: UploadStatusCode.failed,
    error,
  },
});
