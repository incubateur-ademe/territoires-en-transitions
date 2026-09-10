import type {
  ArchiveFile,
  SkippedFile,
} from '../generate-preuves-archive/generate-archive-folder-arborescence';

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_FILE_COUNT = 500;
export const MAX_TOTAL_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

const FILE_SIZE_UNKNOWN = 'Taille du fichier inconnue';

export interface ArchiveCandidateFile {
  bucketId: string;
  hash: string;
  filename: string | null;
  filesize: number | null;
}

export type ArchiveFileTriage =
  | { kind: 'collected'; file: ArchiveFile }
  | { kind: 'skipped'; entry: SkippedFile };

export function triageArchiveFile({
  file,
  folderSegments,
}: {
  file: ArchiveCandidateFile;
  folderSegments: string[];
}): ArchiveFileTriage {
  const emplacement = folderSegments.join('/');
  const filename = file.filename ?? file.hash;

  if (file.filesize === null) {
    return {
      kind: 'skipped',
      entry: { filename, emplacement, raison: FILE_SIZE_UNKNOWN },
    };
  }

  if (file.filesize > MAX_FILE_SIZE_BYTES) {
    return {
      kind: 'skipped',
      entry: {
        filename,
        emplacement,
        raison: `Fichier trop volumineux (${file.filesize} octets, limite ${MAX_FILE_SIZE_BYTES})`,
      },
    };
  }

  return {
    kind: 'collected',
    file: {
      folderSegments,
      filename,
      bucketId: file.bucketId,
      hash: file.hash,
      filesize: file.filesize,
    },
  };
}

export type ArchiveLimitsCheck =
  | { withinLimits: true }
  | { withinLimits: false; raison: string };

export function checkArchiveLimits(files: ArchiveFile[]): ArchiveLimitsCheck {
  if (files.length > MAX_FILE_COUNT) {
    return {
      withinLimits: false,
      raison: `Trop de fichiers à archiver (${files.length}, limite ${MAX_FILE_COUNT})`,
    };
  }

  const totalSize = files.reduce((sum, file) => sum + file.filesize, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    return {
      withinLimits: false,
      raison: `Archive trop volumineuse (${totalSize} octets, limite ${MAX_TOTAL_SIZE_BYTES})`,
    };
  }

  return { withinLimits: true };
}
