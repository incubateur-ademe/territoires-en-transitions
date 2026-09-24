import type {
  CollectedDocuments,
  CollectedFile,
  CollectedLink,
} from '@tet/backend/collectivites/documents/list-documents-by-scope/triage-documents';
import { MAX_ARCHIVED_FILE_SIZE_BYTES } from '@tet/backend/utils/archive/triage-archive-files.utils';
import { toDocumentHash } from '@tet/domain/collectivites';
import { describe, expect, test } from 'vitest';
import {
  toArchiveArborescence,
  toArchiveFilename,
} from './to-archive-arborescence';

type FileFixture = {
  hash: string;
  filename: string;
  filesize: number | null;
};

const toFile = ({ hash, filename, filesize }: FileFixture): CollectedFile => ({
  bucketId: 'collectivite-1',
  hash: toDocumentHash(hash.padStart(64, '0')),
  filename,
  filesize,
  actionId: 'cae_1.1.2',
});

const lien: CollectedLink = {
  url: 'https://exemple.test',
  titre: 'lien',
  commentaire: null,
  actionId: 'cae_1.1.2',
};

const toDocuments = ({
  files = [],
  links = [],
}: {
  files?: FileFixture[];
  links?: CollectedLink[];
}): CollectedDocuments => ({
  files: files.map(toFile),
  missingFiles: [],
  links,
});

describe('toArchiveArborescence', () => {
  test('rend un fichier d archive par document collecté', () => {
    const { files } = toArchiveArborescence(
      toDocuments({
        files: [
          { hash: 'a', filename: 'deliberation.pdf', filesize: 1024 },
          { hash: 'b', filename: 'annexe.pdf', filesize: 1024 },
        ],
      })
    );

    expect(files.map(({ filename }) => filename)).toEqual([
      'deliberation.pdf',
      'annexe.pdf',
    ]);
  });

  test("ne retient qu'un exemplaire d'un contenu porté par deux documents", () => {
    const { files } = toArchiveArborescence(
      toDocuments({
        files: [
          { hash: 'a', filename: 'deliberation.pdf', filesize: 1024 },
          { hash: 'a', filename: 'deliberation.pdf', filesize: 1024 },
        ],
      })
    );

    expect(files).toHaveLength(1);
  });

  test('garde les deux fichiers quand seuls les noms coïncident', () => {
    const { files } = toArchiveArborescence(
      toDocuments({
        files: [
          { hash: 'a', filename: 'rapport.pdf', filesize: 1024 },
          { hash: 'b', filename: 'rapport.pdf', filesize: 1024 },
        ],
      })
    );

    expect(files.map(({ filename }) => filename)).toEqual([
      'rapport.pdf',
      'rapport.pdf',
    ]);
  });

  test("laisse les liens hors de l'archive", () => {
    const { files, linkFolders } = toArchiveArborescence(
      toDocuments({
        files: [{ hash: 'b', filename: 'annexe.pdf', filesize: 1024 }],
        links: [lien],
      })
    );

    expect(files.map(({ filename }) => filename)).toEqual(['annexe.pdf']);
    expect(linkFolders).toEqual([]);
  });

  test('rend une liste vide quand la mesure ne porte aucun fichier', () => {
    expect(toArchiveArborescence(toDocuments({}))).toEqual({
      files: [],
      linkFolders: [],
      skippedFiles: [],
    });
  });

  test('écarte un document dont la taille est inconnue et le consigne', () => {
    const { files, skippedFiles } = toArchiveArborescence(
      toDocuments({
        files: [{ hash: 'a', filename: 'sans-taille.pdf', filesize: null }],
      })
    );

    expect(files).toEqual([]);
    expect(skippedFiles).toEqual([
      {
        filename: 'sans-taille.pdf',
        emplacement: '',
        raison: 'Taille du fichier inconnue',
      },
    ]);
  });

  test('écarte un document de plus de 100 Mo et le consigne', () => {
    const { files, skippedFiles } = toArchiveArborescence(
      toDocuments({
        files: [
          { hash: 'a', filename: 'petit.pdf', filesize: 1024 },
          {
            hash: 'b',
            filename: 'enorme.pdf',
            filesize: MAX_ARCHIVED_FILE_SIZE_BYTES + 1,
          },
        ],
      })
    );

    expect(files.map(({ filename }) => filename)).toEqual(['petit.pdf']);
    expect(skippedFiles.map(({ filename }) => filename)).toEqual([
      'enorme.pdf',
    ]);
  });
});

describe('toArchiveFilename', () => {
  test("préfixe le nom de la collectivité par le référentiel et l'identifiant", () => {
    expect(
      toArchiveFilename({
        referentielId: 'cae',
        actionId: 'cae_1.1.2',
        collectiviteNom: 'Ambérieu',
      })
    ).toBe('cae_1.1.2_Ambérieu.zip');
  });
});
