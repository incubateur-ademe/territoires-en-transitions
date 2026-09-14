import { describe, expect, test } from 'vitest';
import type { ArchiveFile } from './archive-arborescence.types';
import {
  checkArchiveLimits,
  MAX_FILE_COUNT,
  MAX_TOTAL_SIZE_BYTES,
} from './check-archive-limits.utils';

const toArchiveFile = (filesize: number): ArchiveFile => ({
  folderSegments: [],
  filename: 'document.pdf',
  bucketId: 'collectivite-1',
  hash: 'a'.repeat(64),
  filesize,
});

describe('checkArchiveLimits', () => {
  test('accepte une archive sous les deux plafonds', () => {
    expect(checkArchiveLimits([toArchiveFile(1024)])).toEqual({
      withinLimits: true,
    });
  });

  test('refuse au-dela de 500 fichiers', () => {
    const files = Array.from({ length: MAX_FILE_COUNT + 1 }, () =>
      toArchiveFile(1)
    );

    expect(checkArchiveLimits(files)).toEqual({
      withinLimits: false,
      exceeded: 'fileCount',
      fileCount: 501,
      limit: 500,
    });
  });

  test('applique le plafond de fichiers fourni par l appelant', () => {
    const files = Array.from({ length: 101 }, () => toArchiveFile(1));

    expect(checkArchiveLimits(files, { maxFileCount: 100 })).toEqual({
      withinLimits: false,
      exceeded: 'fileCount',
      fileCount: 101,
      limit: 100,
    });
  });

  test('applique le plafond de volume fourni par l appelant', () => {
    expect(
      checkArchiveLimits([toArchiveFile(2048)], { maxTotalSizeBytes: 1024 })
    ).toEqual({
      withinLimits: false,
      exceeded: 'totalSize',
      totalSize: 2048,
      limit: 1024,
    });
  });

  test('refuse au-dela de 2 Go au total', () => {
    const files = [toArchiveFile(MAX_TOTAL_SIZE_BYTES), toArchiveFile(1)];

    expect(checkArchiveLimits(files)).toEqual({
      withinLimits: false,
      exceeded: 'totalSize',
      totalSize: MAX_TOTAL_SIZE_BYTES + 1,
      limit: 2 * 1024 * 1024 * 1024,
    });
  });
});
