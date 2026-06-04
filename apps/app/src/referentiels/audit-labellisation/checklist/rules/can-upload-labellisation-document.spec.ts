import { describe, expect, it } from 'vitest';
import { canUploadLabellisationDocument } from './can-upload-labellisation-document';

describe('canUploadLabellisationDocument', () => {
  it('autorise un éditeur de la collectivité (mutation, non auditeur)', () => {
    expect(
      canUploadLabellisationDocument({
        canMutateReferentiels: true,
        isAuditeur: false,
      })
    ).toBe(true);
  });

  it("refuse l'auditeur même s'il a la permission de mutation", () => {
    expect(
      canUploadLabellisationDocument({
        canMutateReferentiels: true,
        isAuditeur: true,
      })
    ).toBe(false);
  });

  it('refuse un viewer sans permission de mutation', () => {
    expect(
      canUploadLabellisationDocument({
        canMutateReferentiels: false,
        isAuditeur: false,
      })
    ).toBe(false);
  });
});
