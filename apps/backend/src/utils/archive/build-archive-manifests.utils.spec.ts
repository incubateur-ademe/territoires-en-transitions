import { describe, expect, it } from 'vitest';
import {
  buildArchiveManifests,
  listLinksCsvPaths,
} from './build-archive-manifests.utils';
import type { ArchiveFolderArborescence } from './archive-arborescence.types';

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
            links: [
              { titre: 'Site officiel', url: 'https://x', commentaire: '' },
            ],
          },
          {
            folderSegments: ['cycle-labellisation', 'audit'],
            links: [],
          },
        ],
      }),
      failedDownloads: [],
    });

    expect(entries.map((entry) => entry.name)).toEqual([
      'mesures/axe-1/liens.csv',
    ]);
  });

  it('agrège skippedFiles et failedDownloads dans `_manifeste/fichiers-manquants.txt`', () => {
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
      failedDownloads: [
        {
          filename: 'perdu.pdf',
          emplacement: 'mesures/axe-1',
          raison: 'Téléchargement échoué',
        },
      ],
    });

    expect(entries).toEqual([
      {
        name: '_manifeste/fichiers-manquants.txt',
        content:
          'mesures/axe-1/gros.pdf — Fichier trop volumineux\n' +
          'mesures/axe-1/perdu.pdf — Téléchargement échoué\n',
      },
    ]);
  });

  it('aplatit un saut de ligne du nom de fichier au lieu de forger une ligne de manquant', () => {
    const entries = buildArchiveManifests({
      arborescence: emptyArborescence({
        skippedFiles: [
          {
            filename:
              'innocent.pdf\nmesures/axe-1/fantome.pdf — Fichier trop volumineux',
            emplacement: 'mesures/axe-1',
            raison: 'Fichier trop volumineux',
          },
        ],
      }),
      failedDownloads: [],
    });

    expect(entries).toEqual([
      {
        name: '_manifeste/fichiers-manquants.txt',
        content:
          'mesures/axe-1/innocent.pdf mesures/axe-1/fantome.pdf — Fichier trop volumineux — Fichier trop volumineux\n',
      },
    ]);
  });

  it("n'émet pas de manifeste vide quand aucune raison de manquant", () => {
    const entries = buildArchiveManifests({
      arborescence: emptyArborescence({
        linkFolders: [
          {
            folderSegments: ['mesures'],
            links: [{ titre: 'X', url: 'https://x', commentaire: '' }],
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
            links: [{ titre: 'X', url: 'https://x', commentaire: '' }],
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

describe('listLinksCsvPaths', () => {
  it('ne réserve un chemin que pour les dossiers qui portent des liens', () => {
    const paths = listLinksCsvPaths(
      emptyArborescence({
        linkFolders: [
          { folderSegments: ['mesures', 'axe-1'], links: [] },
          {
            folderSegments: ['mesures', 'axe-2'],
            links: [{ titre: 'X', url: 'https://x', commentaire: '' }],
          },
        ],
      })
    );

    expect(paths).toEqual(['mesures/axe-2/liens.csv']);
  });
});
