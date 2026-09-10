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

export function checkArchiveLimits(files: ArchiveFile[]): ArchiveLimitsCheck {
  if (files.length > MAX_FILE_COUNT) {
    return {
      withinLimits: false,
      exceeded: 'fileCount',
      fileCount: files.length,
      limit: MAX_FILE_COUNT,
    };
  }

  const totalSize = files.reduce((sum, file) => sum + file.filesize, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    return {
      withinLimits: false,
      exceeded: 'totalSize',
      totalSize,
      limit: MAX_TOTAL_SIZE_BYTES,
    };
  }

  return { withinLimits: true };
}
