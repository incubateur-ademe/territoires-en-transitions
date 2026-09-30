import { describe, expect, it } from 'vitest';
import { canUpdateRapportAudit } from './can-update-rapport-audit.rule';

const now = new Date('2026-06-22T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const auditeur = { isAuditeur: true, canMutateLabellisationDocuments: false };
const tiers = { isAuditeur: false, canMutateLabellisationDocuments: false };
const porteurPermission = {
  isAuditeur: false,
  canMutateLabellisationDocuments: true,
};

describe('canUpdateRapportAudit', () => {
  it("refuse une preuve sans rapport d'audit", () => {
    expect(canUpdateRapportAudit({ ...auditeur, audit: null, now })).toBe(
      false
    );
  });

  it("refuse un tiers à l'audit", () => {
    expect(
      canUpdateRapportAudit({
        ...tiers,
        audit: { clos: false, valide: false, dateFin: null },
        now,
      })
    ).toBe(false);
  });

  it("autorise l'auditeur tant que l'audit n'est pas valide", () => {
    expect(
      canUpdateRapportAudit({
        ...auditeur,
        audit: { clos: false, valide: false, dateFin: null },
        now,
      })
    ).toBe(true);
  });

  it('autorise dans les 15 jours suivant la validation', () => {
    expect(
      canUpdateRapportAudit({
        ...auditeur,
        audit: { clos: false, valide: true, dateFin: daysAgo(14) },
        now,
      })
    ).toBe(true);
  });

  it('refuse plus de 15 jours apres la validation', () => {
    expect(
      canUpdateRapportAudit({
        ...auditeur,
        audit: { clos: false, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(false);
  });

  it('autorise dans les 15 jours même si l’audit est clos', () => {
    expect(
      canUpdateRapportAudit({
        ...auditeur,
        audit: { clos: true, valide: true, dateFin: daysAgo(14) },
        now,
      })
    ).toBe(true);
  });

  it("refuse plus de 15 jours après la clôture, même si l'audit est clos", () => {
    expect(
      canUpdateRapportAudit({
        ...auditeur,
        audit: { clos: true, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(false);
  });

  it('refuse un audit valide sans date de fin', () => {
    expect(
      canUpdateRapportAudit({
        ...auditeur,
        audit: { clos: false, valide: true, dateFin: null },
        now,
      })
    ).toBe(false);
  });

  it('autorise la permission sur un audit clos depuis plus de 15 jours', () => {
    expect(
      canUpdateRapportAudit({
        ...porteurPermission,
        audit: { clos: true, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(true);
  });

  it('autorise la permission sur un audit valide sans date de fin', () => {
    expect(
      canUpdateRapportAudit({
        ...porteurPermission,
        audit: { clos: false, valide: true, dateFin: null },
        now,
      })
    ).toBe(true);
  });

  it("autorise l'auditeur hors fenêtre qui détient aussi la permission", () => {
    expect(
      canUpdateRapportAudit({
        isAuditeur: true,
        canMutateLabellisationDocuments: true,
        audit: { clos: true, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(true);
  });

  it("refuse la permission quand la preuve n'a pas de rapport d'audit", () => {
    expect(
      canUpdateRapportAudit({ ...porteurPermission, audit: null, now })
    ).toBe(false);
  });
});
