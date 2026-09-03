import { describe, expect, it } from 'vitest';
import { canModifyCandidatureDocuments } from './can-modify-candidature-documents.rule';

const sansPermission = { canMutateLabellisationDocuments: false };
const avecPermission = { canMutateLabellisationDocuments: true };

describe('canModifyCandidatureDocuments', () => {
  it("autorise quand il n'y a pas d'audit", () => {
    expect(
      canModifyCandidatureDocuments({ ...sansPermission, audit: null })
    ).toBe(true);
  });

  it("autorise tant que l'audit n'est pas validé (audit en cours)", () => {
    expect(
      canModifyCandidatureDocuments({
        ...sansPermission,
        audit: { valide: false },
      })
    ).toBe(true);
  });

  it("verrouille dès que l'audit est validé (labellisation en cours)", () => {
    expect(
      canModifyCandidatureDocuments({
        ...sansPermission,
        audit: { valide: true },
      })
    ).toBe(false);
  });

  it("autorise le porteur de la permission sur un audit validé", () => {
    expect(
      canModifyCandidatureDocuments({
        ...avecPermission,
        audit: { valide: true },
      })
    ).toBe(true);
  });
});
