import { describe, expect, it } from 'vitest';
import {
  bibliothequeFichierSchemaCreate,
  documentHashSchema,
  storedDocumentHashSchema,
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

describe('storedDocumentHashSchema', () => {
  it.each([
    ['une empreinte SHA-256', VALID_SHA256],
    ['un nom de fichier hérité', 'Délibération conseil 2019.pdf'],
    ['un nom de fichier hérité contenant deux points', 'rapport..final.pdf'],
    ["un nom d'un seul caractère", 'a'],
    ['un nom de 160 caractères', 'a'.repeat(160)],
  ])('accepte %s', (_case, hash) => {
    expect(storedDocumentHashSchema.safeParse(hash).success).toBe(true);
  });

  it.each([
    ['une remontée de répertoire', '../autreBucket/document'],
    ['un séparateur de chemin', 'autreBucket/document.pdf'],
    ['un antislash', 'autreBucket\\document.pdf'],
    ['une remontée encodée', '%2e%2e%2fdocument.pdf'],
    ['un espace en début', ' document.pdf'],
    ['un espace en fin', 'document.pdf '],
    ['une tabulation en fin', 'document.pdf\t'],
    ['un retour à la ligne en fin', 'document.pdf\n'],
    ['une espace insécable en fin', 'document.pdf\u00a0'],
    ['un point seul', '.'],
    ['deux points seuls', '..'],
    ['une chaîne vide', ''],
    ['un nom de plus de 160 caractères', 'a'.repeat(161)],
  ])('refuse %s', (_case, hash) => {
    expect(storedDocumentHashSchema.safeParse(hash).success).toBe(false);
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
