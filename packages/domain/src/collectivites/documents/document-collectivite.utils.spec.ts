import { describe, expect, test } from 'vitest';
import { toDocumentHash } from './bibliotheque-fichier.schema';
import { getDocumentFilename } from './document-collectivite.utils';

const fichier = {
  id: 1,
  collectiviteId: 1,
  hash: toDocumentHash('a'.repeat(64)),
  filename: 'deliberation.pdf',
  confidentiel: false,
  bucketId: 'bucket',
  filesize: 2048,
};

describe('getDocumentFilename', () => {
  test('rend le nom porté par le fichier stocké', () => {
    expect(getDocumentFilename({ type: 'fichier', fichier })).toBe(
      'deliberation.pdf'
    );
  });

  test('rend le nom conservé en bibliothèque quand les octets ont disparu', () => {
    expect(
      getDocumentFilename({ type: 'fichierManquant', filename: 'perdu.pdf' })
    ).toBe('perdu.pdf');
  });

  test("ne rend aucun nom pour un lien, qui n'en porte pas", () => {
    expect(
      getDocumentFilename({
        type: 'lien',
        lien: { url: 'https://exemple.fr', titre: 'Exemple' },
      })
    ).toBeNull();
  });

  test('ne rend aucun nom quand rien n a été déposé', () => {
    expect(getDocumentFilename({ type: 'nonRenseigne' })).toBeNull();
  });
});
