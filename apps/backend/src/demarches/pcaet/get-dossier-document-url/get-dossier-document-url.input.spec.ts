import { describe, expect, it } from 'vitest';
import { getDossierDocumentUrlInputSchema } from './get-dossier-document-url.input';

describe('getDossierDocumentUrlInputSchema', () => {
  it.each([
    { demandeAvisId: 1, documentId: 'pcaet_diagnostic' },
    { demarcheId: 2, documentAdditionalId: 42 },
  ])('accepte une référence de pièce du dossier : %j', (input) => {
    expect(getDossierDocumentUrlInputSchema.parse(input)).toEqual(input);
  });

  it.each([
    { demandeAvisId: 1 },
    {
      demandeAvisId: 1,
      documentId: 'pcaet_diagnostic',
      documentAdditionalId: 42,
    },
  ])('refuse une référence de pièce absente ou ambiguë : %j', (input) => {
    expect(getDossierDocumentUrlInputSchema.safeParse(input).success).toBe(
      false
    );
  });
});
