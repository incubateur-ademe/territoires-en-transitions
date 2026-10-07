import { describe, expect, it } from 'vitest';
import type { ArchiveFile } from './archive-arborescence.types';
import { prepareArchiveEntries } from './prepare-archive-entries.utils';

function makeFile(overrides: Partial<ArchiveFile> = {}): ArchiveFile {
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
    const entries = prepareArchiveEntries([makeFile()], []);

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

  it('suffixe `(2)`, `(3)`... pour les doublons de chemin', () => {
    const files = [
      makeFile({ hash: 'a' }),
      makeFile({ hash: 'b' }),
      makeFile({ hash: 'c' }),
    ];

    const entries = prepareArchiveEntries(files, []);

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

    const entries = prepareArchiveEntries(files, []);

    expect(entries[1].entryPath).toBe('mesures/axe-1/rapport.tar (2).gz');
  });

  it('ajoute le suffixe en fin pour un fichier sans extension', () => {
    const files = [
      makeFile({ filename: 'README', hash: 'a' }),
      makeFile({ filename: 'README', hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files, []);

    expect(entries[1].entryPath).toBe('mesures/axe-1/README (2)');
  });

  it('ajoute le suffixe en fin pour un fichier commençant par un point', () => {
    const files = [
      makeFile({ filename: '.env', hash: 'a' }),
      makeFile({ filename: '.env', hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files, []);

    expect(entries[1].entryPath).toBe('mesures/axe-1/.env (2)');
  });

  it('ne déduplique pas entre dossiers distincts', () => {
    const files = [
      makeFile({ folderSegments: ['mesures', 'axe-1'], hash: 'a' }),
      makeFile({ folderSegments: ['mesures', 'axe-2'], hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files, []);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      'mesures/axe-1/document.pdf',
      'mesures/axe-2/document.pdf',
    ]);
  });

  it('ne réattribue pas `document (2).pdf` à un fichier portant déjà ce nom', () => {
    const files = [
      makeFile({ filename: 'document.pdf', hash: 'a' }),
      makeFile({ filename: 'document.pdf', hash: 'b' }),
      makeFile({ filename: 'document (2).pdf', hash: 'c' }),
    ];

    const entries = prepareArchiveEntries(files, []);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      'mesures/axe-1/document.pdf',
      'mesures/axe-1/document (2).pdf',
      'mesures/axe-1/document (2) (2).pdf',
    ]);
  });

  it('saute une occurrence quand le nom suffixé a été pris plus tôt dans la liste', () => {
    const files = [
      makeFile({ filename: 'document.pdf', hash: 'a' }),
      makeFile({ filename: 'document (2).pdf', hash: 'b' }),
      makeFile({ filename: 'document.pdf', hash: 'c' }),
    ];

    const entries = prepareArchiveEntries(files, []);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      'mesures/axe-1/document.pdf',
      'mesures/axe-1/document (2).pdf',
      'mesures/axe-1/document (3).pdf',
    ]);
  });

  it('préfixe par le rang quand la troncature à 255 octets efface le suffixe', () => {
    const longFilename = `${'a'.repeat(300)}.pdf`;
    const files = [
      makeFile({ filename: longFilename, hash: 'a'.repeat(64) }),
      makeFile({ filename: longFilename, hash: 'b'.repeat(64) }),
    ];

    const entries = prepareArchiveEntries(files, []);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      `mesures/axe-1/${'a'.repeat(251)}.pdf`,
      `mesures/axe-1/2 ${'a'.repeat(249)}.pdf`,
    ]);
  });

  it('distingue trois fichiers de même hash dont le nom dépasse 255 octets', () => {
    const longFilename = `${'a'.repeat(300)}.pdf`;
    const sameHash = 'a'.repeat(64);
    const files = [
      makeFile({ filename: longFilename, hash: sameHash }),
      makeFile({ filename: longFilename, hash: sameHash }),
      makeFile({ filename: longFilename, hash: sameHash }),
    ];

    const entries = prepareArchiveEntries(files, []);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      `mesures/axe-1/${'a'.repeat(251)}.pdf`,
      `mesures/axe-1/2 ${'a'.repeat(249)}.pdf`,
      `mesures/axe-1/3 ${'a'.repeat(249)}.pdf`,
    ]);
  });

  it('suffixe le document utilisateur qui porte un chemin réservé', () => {
    const files = [
      makeFile({ filename: 'liens.csv', hash: 'a' }),
      makeFile({ filename: 'autre.pdf', hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files, ['mesures/axe-1/liens.csv']);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      'mesures/axe-1/liens (2).csv',
      'mesures/axe-1/autre.pdf',
    ]);
  });

  it('réserve le chemin quel que soit le rang du document homonyme', () => {
    const files = [
      makeFile({ filename: 'autre.pdf', hash: 'a' }),
      makeFile({ filename: 'liens.csv', hash: 'b' }),
    ];

    const entries = prepareArchiveEntries(files, ['mesures/axe-1/liens.csv']);

    expect(entries.map((entry) => entry.entryPath)).toEqual([
      'mesures/axe-1/autre.pdf',
      'mesures/axe-1/liens (2).csv',
    ]);
  });

  it('expose `emplacement` joint par `/`', () => {
    const entries = prepareArchiveEntries(
      [makeFile({ folderSegments: ['cycle-labellisation', 'audit'] })],
      []
    );

    expect(entries[0].emplacement).toBe('cycle-labellisation/audit');
  });
});
