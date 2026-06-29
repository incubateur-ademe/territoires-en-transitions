import { describe, expect, it } from 'vitest';
import { canUpdateAuditReport } from './can-update-audit-report.rule';

const now = new Date('2026-06-22T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('canUpdateAuditReport', () => {
  it("refuse une preuve sans rapport d'audit", () => {
    expect(canUpdateAuditReport({ isAuditeur: true, audit: null, now })).toBe(
      false
    );
  });

  it("refuse si l'utilisateur n'est pas l'auditeur de cet audit", () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: false,
        audit: { clos: false, valide: false, dateFin: null },
        now,
      })
    ).toBe(false);
  });

  it("autorise l'auditeur tant que l'audit n'est pas valide", () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: true,
        audit: { clos: false, valide: false, dateFin: null },
        now,
      })
    ).toBe(true);
  });

  it('autorise dans les 15 jours suivant la validation', () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: true,
        audit: { clos: false, valide: true, dateFin: daysAgo(14) },
        now,
      })
    ).toBe(true);
  });

  it('refuse plus de 15 jours apres la validation', () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: true,
        audit: { clos: false, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(false);
  });

  it('autorise dans les 15 jours même si l’audit est clos', () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: true,
        audit: { clos: true, valide: true, dateFin: daysAgo(14) },
        now,
      })
    ).toBe(true);
  });

  it("refuse plus de 15 jours après la clôture, même si l'audit est clos", () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: true,
        audit: { clos: true, valide: true, dateFin: daysAgo(16) },
        now,
      })
    ).toBe(false);
  });

  it('refuse un audit valide sans date de fin', () => {
    expect(
      canUpdateAuditReport({
        isAuditeur: true,
        audit: { clos: false, valide: true, dateFin: null },
        now,
      })
    ).toBe(false);
  });
});
