import { describe, expect, it } from 'vitest';
import { peutModifierPreuveAuditOuLabellisation } from './peutModifierPreuveAuditOuLabellisation';

describe('peutModifierPreuveAuditOuLabellisation', () => {
  it("autorise un membre avec mutation sur un document de candidature tant que l'audit n'est pas validé", () => {
    expect(
      peutModifierPreuveAuditOuLabellisation({
        preuveType: 'labellisation',
        status: 'demande_envoyee',
        isAuditeur: false,
        canMutateReferentiels: true,
      })
    ).toBe(true);
  });

  it("verrouille les documents de candidature une fois l'audit validé", () => {
    expect(
      peutModifierPreuveAuditOuLabellisation({
        preuveType: 'labellisation',
        status: 'audit_valide',
        isAuditeur: false,
        canMutateReferentiels: true,
      })
    ).toBe(false);
  });

  it('refuse tout sans la permission de mutation', () => {
    expect(
      peutModifierPreuveAuditOuLabellisation({
        preuveType: 'labellisation',
        status: 'demande_envoyee',
        isAuditeur: false,
        canMutateReferentiels: false,
      })
    ).toBe(false);
  });

  it("verrouille le rapport d'audit pour la collectivité pendant l'audit", () => {
    expect(
      peutModifierPreuveAuditOuLabellisation({
        preuveType: 'audit',
        status: 'audit_en_cours',
        isAuditeur: false,
        canMutateReferentiels: true,
      })
    ).toBe(false);
  });

  it("autorise l'auditeur à modifier le rapport d'audit pendant l'audit", () => {
    expect(
      peutModifierPreuveAuditOuLabellisation({
        preuveType: 'audit',
        status: 'audit_en_cours',
        isAuditeur: true,
        canMutateReferentiels: false,
      })
    ).toBe(true);
  });

  it("autorise l'auditeur à modifier le rapport d'audit après validation (fenêtre portée par le rôle)", () => {
    expect(
      peutModifierPreuveAuditOuLabellisation({
        preuveType: 'audit',
        status: 'audit_valide',
        isAuditeur: true,
        canMutateReferentiels: false,
      })
    ).toBe(true);
  });
});
