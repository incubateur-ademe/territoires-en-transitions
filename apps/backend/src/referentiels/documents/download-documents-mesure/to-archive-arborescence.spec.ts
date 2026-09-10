import { describe, expect, test } from 'vitest';
import z from 'zod';
import { MAX_FILE_SIZE_BYTES } from '../../preuves-archive/build-archive/archive-limits';
import {
  listDocumentsMesureOutputSchema,
  type ListDocumentsMesureOutput,
} from '../list-documents-mesure/list-documents-mesure.output';
import {
  toArchiveArborescence,
  toArchiveFilename,
} from './to-archive-arborescence';

type DocumentsFixture = z.input<typeof listDocumentsMesureOutputSchema>;
type ComplementaireFixture = DocumentsFixture['complementaires'][number];
type FichierFixture = NonNullable<ComplementaireFixture['fichier']>;
type SupportFixture = Pick<ComplementaireFixture, 'fichier' | 'lien'>;
type DocumentBaseFixture = Omit<
  ComplementaireFixture,
  'fichier' | 'lien' | 'preuveType'
>;

type Fichier = {
  hash: string;
  filename: string;
  bucketId?: string;
  filesize?: number;
};

const mesure = { actionId: 'cae_1.1.2', identifiant: '1.1.2' };
const attenduDefinition = { id: 'attendu', nom: 'Attendu', description: '' };

const toFichier = ({
  hash,
  filename,
  bucketId = 'collectivite-1',
  filesize,
}: Fichier): FichierFixture => ({
  id: 1,
  collectiviteId: 1,
  hash,
  filename,
  confidentiel: false,
  bucketId,
  filesize: filesize ?? null,
});

const toSupport = (fichier: Fichier | null): SupportFixture => {
  if (fichier === null) {
    return {
      fichier: null,
      lien: { url: 'https://exemple.test', titre: 'lien' },
    };
  }
  return { fichier: toFichier(fichier), lien: null };
};

const toDocumentBase = (id: number): DocumentBaseFixture => ({
  id,
  collectiviteId: 1,
  commentaire: null,
  modifiedAt: '2026-01-01',
  modifiedBy: null,
  modifiedByNom: null,
  action: mesure,
});

const toDocuments = ({
  attendus = [],
  complementaires = [],
}: {
  attendus?: Array<Fichier | null>;
  complementaires?: Array<Fichier | null>;
}): ListDocumentsMesureOutput =>
  listDocumentsMesureOutputSchema.parse({
    attendus: [
      {
        preuveReglementaire: attenduDefinition,
        action: mesure,
        documents: attendus.map((fichier, index) => ({
          ...toDocumentBase(index),
          preuveType: 'reglementaire',
          preuveReglementaire: attenduDefinition,
          ...toSupport(fichier),
        })),
      },
    ],
    complementaires: complementaires.map((fichier, index) => ({
      ...toDocumentBase(100 + index),
      preuveType: 'complementaire',
      ...toSupport(fichier),
    })),
  });

describe('toArchiveArborescence', () => {
  test('réunit les documents attendus et complémentaires', () => {
    const { files } = toArchiveArborescence(
      toDocuments({
        attendus: [{ hash: 'a', filename: 'deliberation.pdf', filesize: 10 }],
        complementaires: [{ hash: 'b', filename: 'annexe.pdf', filesize: 10 }],
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
        attendus: [{ hash: 'a', filename: 'deliberation.pdf', filesize: 10 }],
        complementaires: [
          { hash: 'a', filename: 'deliberation.pdf', filesize: 10 },
        ],
      })
    );

    expect(files).toHaveLength(1);
  });

  test('garde les deux fichiers quand seuls les noms coïncident', () => {
    const { files } = toArchiveArborescence(
      toDocuments({
        attendus: [{ hash: 'a', filename: 'rapport.pdf', filesize: 10 }],
        complementaires: [{ hash: 'b', filename: 'rapport.pdf', filesize: 10 }],
      })
    );

    expect(files.map(({ hash }) => hash)).toEqual(['a', 'b']);
  });

  test("écarte les preuves qui ne portent qu'un lien", () => {
    const { files } = toArchiveArborescence(
      toDocuments({
        attendus: [null],
        complementaires: [{ hash: 'b', filename: 'annexe.pdf', filesize: 10 }],
      })
    );

    expect(files.map(({ hash }) => hash)).toEqual(['b']);
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
      toDocuments({ attendus: [{ hash: 'a', filename: 'sans-taille.pdf' }] })
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
        attendus: [
          { hash: 'a', filename: 'petit.pdf', filesize: 10 },
          {
            hash: 'b',
            filename: 'enorme.pdf',
            filesize: MAX_FILE_SIZE_BYTES + 1,
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
      toArchiveFilename({ actionId: 'cae_1.1.2', collectiviteNom: 'Ambérieu' })
    ).toBe('cae_1.1.2_Ambérieu.zip');
  });

  test("retombe sur l'identifiant brut quand il ne désigne aucun référentiel", () => {
    expect(
      toArchiveFilename({ actionId: 'inconnu', collectiviteNom: 'Ambérieu' })
    ).toBe('inconnu_Ambérieu.zip');
  });
});
