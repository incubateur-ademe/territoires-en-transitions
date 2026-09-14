import type { ArchiveFile } from './archive-arborescence.types';

export const MAX_FILE_COUNT = 500;
export const MAX_TOTAL_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

export type ArchiveLimitsExceeded =
  | {
      withinLimits: false;
      exceeded: 'fileCount';
      fileCount: number;
      limit: number;
    }
  | {
      withinLimits: false;
      exceeded: 'totalSize';
      totalSize: number;
      limit: number;
    };

export type ArchiveLimitsCheck = { withinLimits: true } | ArchiveLimitsExceeded;

export type ArchiveLimits = {
  maxFileCount?: number;
  maxTotalSizeBytes?: number;
};

export function checkArchiveLimits(
  files: ArchiveFile[],
  {
    maxFileCount = MAX_FILE_COUNT,
    maxTotalSizeBytes = MAX_TOTAL_SIZE_BYTES,
  }: ArchiveLimits = {}
): ArchiveLimitsCheck {
  if (files.length > maxFileCount) {
    return {
      withinLimits: false,
      exceeded: 'fileCount',
      fileCount: files.length,
      limit: maxFileCount,
    };
  }

  const totalSize = files.reduce((sum, file) => sum + file.filesize, 0);
  if (totalSize > maxTotalSizeBytes) {
    return {
      withinLimits: false,
      exceeded: 'totalSize',
      totalSize,
      limit: maxTotalSizeBytes,
    };
  }

  return { withinLimits: true };
}
