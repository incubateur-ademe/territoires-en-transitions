import { describe, expect, test } from 'vitest';
import type { ArchiveFile } from './archive-arborescence';
import {
  checkArchiveLimits,
  MAX_FILE_COUNT,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_SIZE_BYTES,
  splitTriagedArchiveFiles,
  triageArchiveFile,
} from './archive-limits';

const toArchiveFile = (filesize: number): ArchiveFile => ({
  folderSegments: [],
  filename: 'document.pdf',
  bucketId: 'collectivite-1',
  hash: 'a'.repeat(64),
  filesize,
});

describe('triageArchiveFile', () => {
  test('retient un fichier de taille connue sous la limite', () => {
    const triage = triageArchiveFile({
      file: {
        bucketId: 'collectivite-1',
        hash: 'abc',
        filename: 'deliberation.pdf',
        filesize: 1024,
      },
      folderSegments: ['mesures', '1.1.1'],
    });

    expect(triage).toEqual({
      kind: 'collected',
      file: {
        folderSegments: ['mesures', '1.1.1'],
        filename: 'deliberation.pdf',
        bucketId: 'collectivite-1',
        hash: 'abc',
        filesize: 1024,
      },
    });
  });

  test('écarte un fichier dont la taille est inconnue', () => {
    const triage = triageArchiveFile({
      file: {
        bucketId: 'collectivite-1',
        hash: 'abc',
        filename: 'sans-taille.pdf',
        filesize: null,
      },
      folderSegments: ['mesures'],
    });

    expect(triage).toEqual({
      kind: 'skipped',
      entry: {
        filename: 'sans-taille.pdf',
        emplacement: 'mesures',
        raison: 'Taille du fichier inconnue',
      },
    });
  });

  test('écarte un fichier au-dela de 100 Mo', () => {
    const triage = triageArchiveFile({
      file: {
        bucketId: 'collectivite-1',
        hash: 'abc',
        filename: 'enorme.pdf',
        filesize: MAX_FILE_SIZE_BYTES + 1,
      },
      folderSegments: [],
    });

    expect(triage.kind).toBe('skipped');
  });

  test('nomme un fichier sans filename par son empreinte', () => {
    const triage = triageArchiveFile({
      file: {
        bucketId: 'collectivite-1',
        hash: 'abc',
        filename: null,
        filesize: 10,
      },
      folderSegments: [],
    });

    expect(triage).toMatchObject({
      kind: 'collected',
      file: { filename: 'abc' },
    });
  });
});

describe('splitTriagedArchiveFiles', () => {
  test('sépare les fichiers retenus des fichiers consignés', () => {
    const retenu = toArchiveFile(10);
    const consigne = {
      filename: 'absent.pdf',
      emplacement: '',
      raison: 'Taille du fichier inconnue',
    };

    expect(
      splitTriagedArchiveFiles([
        { kind: 'collected', file: retenu },
        { kind: 'skipped', entry: consigne },
      ])
    ).toEqual({ files: [retenu], skippedFiles: [consigne] });
  });
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
      reason: `Trop de fichiers à archiver (${
        MAX_FILE_COUNT + 1
      }, limite ${MAX_FILE_COUNT})`,
    });
  });

  test('refuse au-dela de 2 Go au total', () => {
    const files = [toArchiveFile(MAX_TOTAL_SIZE_BYTES), toArchiveFile(1)];

    expect(checkArchiveLimits(files)).toEqual({
      withinLimits: false,
      reason: `Archive trop volumineuse (${
        MAX_TOTAL_SIZE_BYTES + 1
      } octets, limite ${MAX_TOTAL_SIZE_BYTES})`,
    });
  });
});
