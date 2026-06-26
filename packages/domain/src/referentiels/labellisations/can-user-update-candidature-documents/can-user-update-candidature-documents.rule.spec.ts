import { describe, expect, it } from 'vitest';
import { canUserUpdateCandidatureDocuments } from './can-user-update-candidature-documents.rule';

describe('canUserUpdateCandidatureDocuments', () => {
  it("refuse un document qui n'est pas un document de candidature", () => {
    expect(
      canUserUpdateCandidatureDocuments({
        preuveType: 'audit',
        canMutateReferentiels: true,
        audit: null,
      })
    ).toBe(false);
  });

  it('autorise un utilisateur avec mutation pendant la phase candidature (pas encore d audit)', () => {
    expect(
      canUserUpdateCandidatureDocuments({
        preuveType: 'labellisation',
        canMutateReferentiels: true,
        audit: null,
      })
    ).toBe(true);
  });

  it("autorise tant que l'audit n'est pas validé", () => {
    expect(
      canUserUpdateCandidatureDocuments({
        preuveType: 'labellisation',
        canMutateReferentiels: true,
        audit: { valide: false },
      })
    ).toBe(true);
  });

  it("verrouille les documents de candidature une fois l'audit validé", () => {
    expect(
      canUserUpdateCandidatureDocuments({
        preuveType: 'labellisation',
        canMutateReferentiels: true,
        audit: { valide: true },
      })
    ).toBe(false);
  });

  it('refuse un utilisateur sans la permission de mutation', () => {
    expect(
      canUserUpdateCandidatureDocuments({
        preuveType: 'labellisation',
        canMutateReferentiels: false,
        audit: { valide: false },
      })
    ).toBe(false);
  });
});
