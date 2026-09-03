import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ListDocumentsAuditService } from './list-documents-audit.service';

const user = { id: 'user-id' } as AuthenticatedUser;

const audit = {
  id: 10,
  collectiviteId: 1,
  referentielId: 'cae',
  demandeId: 20,
  dateDebut: '2026-01-05T09:00:00Z',
  dateFin: null,
  valide: false,
  dateCnl: null,
  valideLabellisation: null,
  clos: false,
};

const documentSansAudit = {
  id: 1,
  collectiviteId: 1,
  fichierId: null,
  url: null,
  titre: null,
  commentaire: null,
  modifiedAt: '2026-01-15T10:00:00Z',
  modifiedBy: null,
  lien: null,
  auditId: 10,
  fichier: null,
  demande: null,
  modifiedByNom: null,
  preuveType: 'audit',
};

function buildService(documents: unknown[]) {
  return new ListDocumentsAuditService(
    { listDocumentsAudit: vi.fn().mockResolvedValue(success(documents)) } as never,
    { getAudit: vi.fn().mockResolvedValue(success(audit)) } as never,
    {
      checkUserCanReadDocuments: vi
        .fn()
        .mockResolvedValue(success({ canReadConfidentiel: true })),
    } as never
  );
}

describe('ListDocumentsAuditService', () => {
  it("refuse un document d'audit dont l'audit manque, au lieu de le rendre", async () => {
    const service = buildService([documentSansAudit]);

    const result = await service.listDocumentsAudit({ auditId: 10 }, user);

    expect(result).toEqual({
      success: false,
      error: 'DOCUMENT_SCHEMA_MISMATCH',
    });
  });
});
