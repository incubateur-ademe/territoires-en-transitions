import { describe, expect, test } from 'vitest';
import type { ArchiveFile } from './archive-arborescence.types';
import {
  MAX_FILE_SIZE_BYTES,
  splitTriagedArchiveFiles,
  triageArchiveFile,
} from './triage-archive-files';

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
      skippedFile: {
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
    const collectedFile = toArchiveFile(10);
    const skippedFile = {
      filename: 'absent.pdf',
      emplacement: '',
      raison: 'Taille du fichier inconnue',
    };

    expect(
      splitTriagedArchiveFiles([
        { kind: 'collected', file: collectedFile },
        { kind: 'skipped', skippedFile },
      ])
    ).toEqual({ files: [collectedFile], skippedFiles: [skippedFile] });
  });
});
