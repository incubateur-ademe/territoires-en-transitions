import { describe, expect, it } from 'vitest';
import { canModifyCandidatureDocuments } from './can-modify-candidature-documents.rule';

describe('canModifyCandidatureDocuments', () => {
  it("autorise quand il n'y a pas d'audit", () => {
    expect(canModifyCandidatureDocuments({ audit: null })).toBe(true);
  });

  it("autorise tant que l'audit n'est pas validé (audit en cours)", () => {
    expect(canModifyCandidatureDocuments({ audit: { valide: false } })).toBe(
      true
    );
  });

  it("verrouille dès que l'audit est validé (labellisation en cours)", () => {
    expect(canModifyCandidatureDocuments({ audit: { valide: true } })).toBe(
      false
    );
  });
});
