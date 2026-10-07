import { describe, expect, it } from 'vitest';
import { canUpdateCandidatureDocuments } from './can-update-candidature-documents.rule';

const audite = { isAuditee: true, canMutateLabellisationDocuments: false };
const superAdmin = { isAuditee: false, canMutateLabellisationDocuments: true };
const auditeurOuVisiteur = {
  isAuditee: false,
  canMutateLabellisationDocuments: false,
};

describe('canUpdateCandidatureDocuments', () => {
  it("autorise l'audité avant tout audit", () => {
    expect(canUpdateCandidatureDocuments({ ...audite, audit: null })).toEqual({
      canUpdate: true,
    });
  });

  it("autorise l'audité pendant l'audit", () => {
    expect(
      canUpdateCandidatureDocuments({ ...audite, audit: { valide: false } })
    ).toEqual({ canUpdate: true });
  });

  it("gele les documents pour l'audité des la validation de l'audit", () => {
    expect(
      canUpdateCandidatureDocuments({ ...audite, audit: { valide: true } })
    ).toEqual({ canUpdate: false, reason: 'frozen' });
  });

  it("refuse qui n'est pas l'audité, audit en cours compris", () => {
    expect(
      canUpdateCandidatureDocuments({
        ...auditeurOuVisiteur,
        audit: { valide: false },
      })
    ).toEqual({ canUpdate: false, reason: 'not_auditee' });
  });

  it("refuse qui n'est pas l'audité avant tout audit", () => {
    expect(
      canUpdateCandidatureDocuments({ ...auditeurOuVisiteur, audit: null })
    ).toEqual({ canUpdate: false, reason: 'not_auditee' });
  });

  it('autorise le super admin sur un audit valide', () => {
    expect(
      canUpdateCandidatureDocuments({ ...superAdmin, audit: { valide: true } })
    ).toEqual({ canUpdate: true });
  });

  it("autorise le super admin sans qu'il soit l'audité", () => {
    expect(
      canUpdateCandidatureDocuments({ ...superAdmin, audit: null })
    ).toEqual({ canUpdate: true });
  });
});
