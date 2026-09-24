import { describe, expect, it } from 'vitest';
import { canAddAuditDocument } from './can-add-audit-document.rule';

const membre = { canMutateLabellisationDocuments: false };
const superAdmin = { canMutateLabellisationDocuments: true };

describe('canAddAuditDocument', () => {
  it('autorise le dépôt sur un audit ouvert', () => {
    expect(
      canAddAuditDocument({ ...membre, audit: { clos: false, valide: false } })
    ).toBe(true);
  });

  it('refuse le dépôt sur un audit validé', () => {
    expect(
      canAddAuditDocument({ ...membre, audit: { clos: false, valide: true } })
    ).toBe(false);
  });

  it('refuse le dépôt sur un audit clos', () => {
    expect(
      canAddAuditDocument({ ...membre, audit: { clos: true, valide: false } })
    ).toBe(false);
  });

  it('refuse le dépôt sur un audit clos et validé', () => {
    expect(
      canAddAuditDocument({ ...membre, audit: { clos: true, valide: true } })
    ).toBe(false);
  });

  it('autorise le dépôt du super-admin sur un audit clos', () => {
    expect(
      canAddAuditDocument({
        ...superAdmin,
        audit: { clos: true, valide: false },
      })
    ).toBe(true);
  });

  it('autorise le dépôt du super-admin sur un audit validé', () => {
    expect(
      canAddAuditDocument({
        ...superAdmin,
        audit: { clos: false, valide: true },
      })
    ).toBe(true);
  });
});
