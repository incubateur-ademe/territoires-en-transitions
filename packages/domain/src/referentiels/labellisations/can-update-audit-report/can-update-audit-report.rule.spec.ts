import { describe, expect, it } from 'vitest';
import { canUpdateAuditReport } from './can-update-audit-report.rule';

const now = new Date('2026-06-22T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const auditeur = { isAuditeur: true, canUpdateAnyAuditReport: false };
const tiers = { isAuditeur: false, canUpdateAnyAuditReport: false };
const porteurPermission = { isAuditeur: false, canUpdateAnyAuditReport: true };

describe('canUpdateAuditReport', () => {
  it("refuse une preuve sans rapport d'audit", () => {
    expect(canUpdateAuditReport({ ...auditeur, audit: null, now })).toBe(false);
  });

  it("refuse un tiers à l'audit", () => {
    expect(
      canUpdateAuditReport({
        ...tiers,
        audit: { clos: false, valide: false, dateFin: null },
        now,
      })
    ).toBe(false);
  });

  it("autorise l'auditeur tant que l'audit n'est pas valide", () => {
    expect(
      canUpdateAuditReport({
        ...auditeur,
        audit: { clos: false, valide: false, dateFin: null },
        now,
      })
    ).toBe(true);
  });

  it('autorise dans les 15 jours suivant la validation', () => {
    expect(
      canUpdateAuditReport({
        ...auditeur,
        audit: { clos: false, valide: true, dateFin: daysAgo(14) },
        now,
      })
    ).toBe(true);
  });

  it('refuse plus de 15 jours apres la validation', () => {
    expect(
      canUpdateAuditReport({
        ...auditeur,
        audit: { clos: false, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(false);
  });

  it('autorise dans les 15 jours même si l’audit est clos', () => {
    expect(
      canUpdateAuditReport({
        ...auditeur,
        audit: { clos: true, valide: true, dateFin: daysAgo(14) },
        now,
      })
    ).toBe(true);
  });

  it("refuse plus de 15 jours après la clôture, même si l'audit est clos", () => {
    expect(
      canUpdateAuditReport({
        ...auditeur,
        audit: { clos: true, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(false);
  });

  it('refuse un audit valide sans date de fin', () => {
    expect(
      canUpdateAuditReport({
        ...auditeur,
        audit: { clos: false, valide: true, dateFin: null },
        now,
      })
    ).toBe(false);
  });

  it("autorise la permission sur un audit clos depuis plus de 15 jours", () => {
    expect(
      canUpdateAuditReport({
        ...porteurPermission,
        audit: { clos: true, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(true);
  });

  it('autorise la permission sur un audit valide sans date de fin', () => {
    expect(
      canUpdateAuditReport({
        ...porteurPermission,
        audit: { clos: false, valide: true, dateFin: null },
        now,
      })
    ).toBe(true);
  });

  it("autorise l'auditeur hors fenêtre qui détient aussi la permission", () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: true,
        canUpdateAnyAuditReport: true,
        audit: { clos: true, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(true);
  });

  it("refuse la permission quand la preuve n'a pas de rapport d'audit", () => {
    expect(
      canUpdateAuditReport({ ...porteurPermission, audit: null, now })
    ).toBe(false);
  });
});
