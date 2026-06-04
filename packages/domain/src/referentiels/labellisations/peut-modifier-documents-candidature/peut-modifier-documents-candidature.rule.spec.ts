import { describe, expect, it } from 'vitest';
import { peutModifierDocumentsCandidature } from './peut-modifier-documents-candidature.rule';

describe('peutModifierDocumentsCandidature', () => {
  it("autorise quand il n'y a pas d'audit", () => {
    expect(peutModifierDocumentsCandidature({ audit: null })).toBe(true);
  });

  it("autorise tant que l'audit n'est pas validé (audit en cours)", () => {
    expect(
      peutModifierDocumentsCandidature({ audit: { valide: false } })
    ).toBe(true);
  });

  it("verrouille dès que l'audit est validé (labellisation en cours)", () => {
    expect(
      peutModifierDocumentsCandidature({ audit: { valide: true } })
    ).toBe(false);
  });
});
