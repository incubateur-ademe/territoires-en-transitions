import { describe, expect, it } from 'vitest';
import {
  bibliothequeFichierSchemaCreate,
  documentHashSchema,
} from './bibliotheque-fichier.schema';

const VALID_SHA256 =
  'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482';

describe('documentHashSchema', () => {
  it('accepte une empreinte SHA-256 de 64 caracteres hexadecimaux minuscules', () => {
    expect(documentHashSchema.safeParse(VALID_SHA256).success).toBe(true);
  });

  it.each([
    ['une remontee de repertoire', '../autreBucket/document'],
    ['une remontee encodee', '%2e%2e/autreBucket/document'],
    ['un separateur de chemin', 'autreBucket/' + VALID_SHA256],
    ['une casse qui designerait un autre objet', VALID_SHA256.toUpperCase()],
  ])('refuse %s', (_case, hash) => {
    expect(documentHashSchema.safeParse(hash).success).toBe(false);
  });
});

describe('bibliothequeFichierSchemaCreate', () => {
  it('refuse un hash qui designe le bucket d une autre collectivite', () => {
    const result = bibliothequeFichierSchemaCreate.safeParse({
      collectiviteId: 1,
      hash: '../autreBucket/document',
      filename: 'document.pdf',
    });

    expect(result.success).toBe(false);
  });

  it('accepte une creation dont le hash est une empreinte SHA-256', () => {
    const result = bibliothequeFichierSchemaCreate.safeParse({
      collectiviteId: 1,
      hash: VALID_SHA256,
      filename: 'document.pdf',
    });

    expect(result.success).toBe(true);
  });
});
