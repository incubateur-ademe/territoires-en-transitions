import { toDocumentHash } from '@tet/domain/collectivites';
import { describe, expect, test } from 'vitest';
import { DocumentRow, toDocuments } from './to-documents.adapter';

const fichier = {
  id: 7,
  collectiviteId: 1,
  hash: toDocumentHash('a'.repeat(64)),
  filename: 'deliberation.pdf',
  confidentiel: false,
  bucketId: 'bucket',
  filesize: 2048,
};

const lien = { url: 'https://exemple.fr', titre: 'Exemple' };

const toRow = (row: Partial<DocumentRow>): DocumentRow => ({
  id: 1,
  fichierId: null,
  fichier: null,
  lien: null,
  bibliothequeFilename: null,
  ...row,
});

describe('toDocuments', () => {
  test('rend un fichier quand la sous-requête de stockage a répondu', () => {
    expect(toDocuments([toRow({ fichierId: 7, fichier })])).toEqual([
      { id: 1, type: 'fichier', fichier },
    ]);
  });

  test('rend un fichier manquant quand seul le nom en bibliothèque subsiste', () => {
    expect(
      toDocuments([
        toRow({ fichierId: 7, bibliothequeFilename: 'deliberation.pdf' }),
      ])
    ).toEqual([
      { id: 1, type: 'fichierManquant', filename: 'deliberation.pdf' },
    ]);
  });

  test('rend un lien quand le dépôt ne porte aucun fichier', () => {
    expect(toDocuments([toRow({ lien })])).toEqual([
      { id: 1, type: 'lien', lien },
    ]);
  });

  test('préfère le fichier au lien quand le dépôt porte les deux', () => {
    expect(toDocuments([toRow({ fichierId: 7, fichier, lien })])).toEqual([
      { id: 1, type: 'fichier', fichier },
    ]);
  });

  test('conserve les colonnes propres à la ligne', () => {
    const [document] = toDocuments([
      { ...toRow({ fichierId: 7, fichier }), commentaire: 'à relire' },
    ]);

    expect(document).toMatchObject({ commentaire: 'à relire' });
  });

  test('écarte une ligne sans dépôt, que la contrainte XOR interdit', () => {
    expect(toDocuments([toRow({})])).toEqual([]);
  });

  test('écarte le dépôt dont le fichier est introuvable dans la bibliothèque de la collectivité', () => {
    expect(toDocuments([toRow({ fichierId: 7 })])).toEqual([]);
  });

  test("écarte l'attendu sans dépôt, dont la jointure gauche ne rend aucun identifiant", () => {
    expect(toDocuments([toRow({ id: null })])).toEqual([]);
  });
});
