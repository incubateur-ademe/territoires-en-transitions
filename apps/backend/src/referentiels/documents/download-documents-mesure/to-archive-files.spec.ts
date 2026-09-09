import { describe, expect, test } from 'vitest';
import {
  listDocumentsMesureOutputSchema,
  type ListDocumentsMesureOutput,
} from '../list-documents-mesure/list-documents-mesure.output';
import { toArchiveFilename, toArchiveFiles } from './to-archive-files';

type Fichier = {
  hash: string;
  filename: string;
  bucketId?: string;
  filesize?: number;
};

type FichierFixture = {
  id: number;
  collectiviteId: number;
  hash: string;
  filename: string;
  confidentiel: boolean;
  bucketId: string;
  filesize: number | null;
};

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

const mesure = { actionId: 'cae_1.1.2', identifiant: '1.1.2' };
const attenduDefinition = { id: 'attendu', nom: 'Attendu', description: '' };

type SupportFixture =
  | { fichier: FichierFixture; lien: null }
  | { fichier: null; lien: { url: string; titre: string } };

const toSupport = (fichier: Fichier | null): SupportFixture => {
  if (fichier === null) {
    return {
      fichier: null,
      lien: { url: 'https://exemple.test', titre: 'lien' },
    };
  }
  return { fichier: toFichier(fichier), lien: null };
};

type DocumentBaseFixture = {
  id: number;
  collectiviteId: number;
  commentaire: null;
  modifiedAt: string;
  modifiedBy: null;
  modifiedByNom: null;
  action: { actionId: string; identifiant: string };
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

describe('toArchiveFiles', () => {
  test('réunit les documents attendus et complémentaires', () => {
    const files = toArchiveFiles(
      toDocuments({
        attendus: [{ hash: 'a', filename: 'deliberation.pdf' }],
        complementaires: [{ hash: 'b', filename: 'annexe.pdf' }],
      })
    );

    expect(files.map(({ filename }) => filename)).toEqual([
      'deliberation.pdf',
      'annexe.pdf',
    ]);
  });

  test("ne retient qu'un exemplaire d'un contenu porté par deux documents", () => {
    const files = toArchiveFiles(
      toDocuments({
        attendus: [{ hash: 'a', filename: 'deliberation.pdf' }],
        complementaires: [{ hash: 'a', filename: 'deliberation.pdf' }],
      })
    );

    expect(files).toHaveLength(1);
  });

  test('garde les deux fichiers quand seuls les noms coïncident', () => {
    const files = toArchiveFiles(
      toDocuments({
        attendus: [{ hash: 'a', filename: 'rapport.pdf' }],
        complementaires: [{ hash: 'b', filename: 'rapport.pdf' }],
      })
    );

    expect(files.map(({ hash }) => hash)).toEqual(['a', 'b']);
  });

  test("écarte les preuves qui ne portent qu'un lien", () => {
    const files = toArchiveFiles(
      toDocuments({
        attendus: [null],
        complementaires: [{ hash: 'b', filename: 'annexe.pdf' }],
      })
    );

    expect(files.map(({ hash }) => hash)).toEqual(['b']);
  });

  test('rend une liste vide quand la mesure ne porte aucun fichier', () => {
    expect(toArchiveFiles(toDocuments({}))).toEqual([]);
  });

  test('reporte la taille absente à zéro plutôt que de la laisser indéfinie', () => {
    const [file] = toArchiveFiles(
      toDocuments({ attendus: [{ hash: 'a', filename: 'sans-taille.pdf' }] })
    );

    expect(file.filesize).toBe(0);
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
