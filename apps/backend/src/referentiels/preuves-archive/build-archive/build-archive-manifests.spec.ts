import { describe, expect, it } from 'vitest';
import { buildArchiveManifests } from './build-archive-manifests';
import type { ArchiveFolderArborescence } from '../generate-preuves-archive/generate-archive-folder-arborescence';

function emptyArborescence(
  overrides: Partial<ArchiveFolderArborescence> = {}
): ArchiveFolderArborescence {
  return {
    files: [],
    linkFolders: [],
    skippedFiles: [],
    ...overrides,
  };
}

describe('buildArchiveManifests', () => {
  it("retourne un tableau vide quand il n'y a rien à émettre", () => {
    const entries = buildArchiveManifests({
      arborescence: emptyArborescence(),
      failedDownloads: [],
    });

    expect(entries).toEqual([]);
  });

  it('émet un `liens.csv` par dossier non vide, ignore les dossiers vides', () => {
    const entries = buildArchiveManifests({
      arborescence: emptyArborescence({
        linkFolders: [
          {
            folderSegments: ['mesures', 'axe-1'],
            liens: [
              { titre: 'Site officiel', url: 'https://x', commentaire: '' },
            ],
          },
          {
            folderSegments: ['cycle-labellisation', 'audit'],
            liens: [],
          },
        ],
      }),
      failedDownloads: [],
    });

    expect(entries.map((entry) => entry.name)).toEqual([
      'mesures/axe-1/liens.csv',
    ]);
  });

  it("agrège skippedFiles et failedDownloads dans `_manifeste/fichiers-manquants.txt`", () => {
    const entries = buildArchiveManifests({
      arborescence: emptyArborescence({
        skippedFiles: [
          {
            filename: 'gros.pdf',
            emplacement: 'mesures/axe-1',
            raison: 'Fichier trop volumineux',
          },
        ],
      }),
      failedDownloads: ['mesures/axe-1/perdu.pdf (téléchargement échoué)'],
    });

    expect(entries).toEqual([
      {
        name: '_manifeste/fichiers-manquants.txt',
        content:
          'mesures/axe-1/gros.pdf — Fichier trop volumineux\n' +
          'mesures/axe-1/perdu.pdf (téléchargement échoué)\n',
      },
    ]);
  });

  it("n'émet pas de manifeste vide quand aucune raison de manquant", () => {
    const entries = buildArchiveManifests({
      arborescence: emptyArborescence({
        linkFolders: [
          {
            folderSegments: ['mesures'],
            liens: [{ titre: 'X', url: 'https://x', commentaire: '' }],
          },
        ],
      }),
      failedDownloads: [],
    });

    expect(entries.map((entry) => entry.name)).toEqual(['mesures/liens.csv']);
  });

  it('concatène liens et manquants dans cet ordre', () => {
    const entries = buildArchiveManifests({
      arborescence: emptyArborescence({
        linkFolders: [
          {
            folderSegments: ['mesures'],
            liens: [{ titre: 'X', url: 'https://x', commentaire: '' }],
          },
        ],
        skippedFiles: [
          { filename: 'a.pdf', emplacement: 'mesures', raison: 'skip' },
        ],
      }),
      failedDownloads: [],
    });

    expect(entries.map((entry) => entry.name)).toEqual([
      'mesures/liens.csv',
      '_manifeste/fichiers-manquants.txt',
    ]);
  });
});
