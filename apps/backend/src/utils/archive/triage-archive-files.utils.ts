import type { ArchiveFile, SkippedFile } from './archive-arborescence.types';

const FILE_SIZE_UNKNOWN = 'Taille du fichier inconnue';

export interface ArchiveCandidateFile {
  bucketId: string;
  hash: string;
  filename: string | null;
  filesize: number | null;
}

export type ArchiveFileTriage =
  | { kind: 'collected'; file: ArchiveFile }
  | { kind: 'skipped'; skippedFile: SkippedFile };

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
      skippedFile: { filename, emplacement, raison: FILE_SIZE_UNKNOWN },
    };
  }

  if (file.filesize < 0) {
    return {
      kind: 'skipped',
      skippedFile: {
        filename,
        emplacement,
        raison: `Taille du fichier invalide (${file.filesize} octets)`,
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

export interface TriagedArchiveFiles {
  files: ArchiveFile[];
  skippedFiles: SkippedFile[];
}

export function splitTriagedArchiveFiles(
  triaged: ArchiveFileTriage[]
): TriagedArchiveFiles {
  return {
    files: triaged.flatMap((triage) =>
      triage.kind === 'collected' ? [triage.file] : []
    ),
    skippedFiles: triaged.flatMap((triage) =>
      triage.kind === 'skipped' ? [triage.skippedFile] : []
    ),
  };
}
