import { describe, expect, it } from 'vitest';
import type { ArchiveFile } from '../generate-preuves-archive/generate-archive-folder-arborescence';
import { prepareArchiveEntries } from './prepare-archive-entries';

function makeFile(
  overrides: Partial<ArchiveFile> = {}
): ArchiveFile {
  return {
    folderSegments: ['mesures', 'axe-1'],
    filename: 'document.pdf',
    bucketId: 'preuves',
    hash: 'abc123',
    filesize: 1024,
    ...overrides,
  };
}

describe('prepareArchiveEntries', () => {
  it('mappe un fichier unique sans suffixe', () => {
    const entries = prepareArchiveEntries([makeFile()]);

    expect(entries).toEqual([
      {
        entryPath: 'mesures/axe-1/document.pdf',
        bucketId: 'preuves',
        hash: 'abc123',
        filename: 'document.pdf',
        emplacement: 'mesures/axe-1',
      },
    ]);
  });

  it("suffixe `(2)`, `(3)`... pour les doublons de chemin", () => {
    const files = [
      makeFile({ hash: 'a' }),
      makeFile({ hash: 'b' }),
      makeFile({ hash: 'c' }),
    ];

    const entries = prepareArchiveEntries(files);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      'mesures/axe-1/document.pdf',
      'mesures/axe-1/document (2).pdf',
      'mesures/axe-1/document (3).pdf',
    ]);
  });

  it('insère le suffixe avant la dernière extension', () => {
    const files = [
      makeFile({ filename: 'rapport.tar.gz', hash: 'a' }),
      makeFile({ filename: 'rapport.tar.gz', hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files);

    expect(entries[1].entryPath).toBe('mesures/axe-1/rapport.tar (2).gz');
  });

  it("ajoute le suffixe en fin pour un fichier sans extension", () => {
    const files = [
      makeFile({ filename: 'README', hash: 'a' }),
      makeFile({ filename: 'README', hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files);

    expect(entries[1].entryPath).toBe('mesures/axe-1/README (2)');
  });

  it("ajoute le suffixe en fin pour un fichier commençant par un point", () => {
    const files = [
      makeFile({ filename: '.env', hash: 'a' }),
      makeFile({ filename: '.env', hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files);

    expect(entries[1].entryPath).toBe('mesures/axe-1/.env (2)');
  });

  it("ne déduplique pas entre dossiers distincts", () => {
    const files = [
      makeFile({ folderSegments: ['mesures', 'axe-1'], hash: 'a' }),
      makeFile({ folderSegments: ['mesures', 'axe-2'], hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      'mesures/axe-1/document.pdf',
      'mesures/axe-2/document.pdf',
    ]);
  });

  it('expose `emplacement` joint par `/`', () => {
    const entries = prepareArchiveEntries([
      makeFile({ folderSegments: ['cycle-labellisation', 'audit'] }),
    ]);

    expect(entries[0].emplacement).toBe('cycle-labellisation/audit');
  });
});
