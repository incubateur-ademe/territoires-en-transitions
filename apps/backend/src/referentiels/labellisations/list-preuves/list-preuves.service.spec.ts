import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ListPreuvesService } from './list-preuves.service';

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

const demande = {
  id: 20,
  collectiviteId: 1,
  referentiel: 'cae',
  enCours: false,
  etoiles: '2',
  date: '2026-01-10T10:00:00Z',
  sujet: 'labellisation',
  modifiedAt: null,
  envoyeeLe: '2026-01-10T10:00:00Z',
  demandeur: null,
  associatedCollectiviteId: null,
};

const preuveAuditHorsContrat = {
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

function buildService(preuves: unknown[]) {
  const listPreuvesAudit = vi.fn().mockResolvedValue(success(preuves));
  const listPreuvesLabellisation = vi.fn().mockResolvedValue(success(preuves));

  const service = new ListPreuvesService(
    { listPreuvesAudit, listPreuvesLabellisation } as never,
    {
      getAudit: vi.fn().mockResolvedValue(success(audit)),
      getDemande: vi.fn().mockResolvedValue(success(demande)),
    } as never,
    {
      checkUserCanReadDocuments: vi
        .fn()
        .mockResolvedValue(success({ canReadConfidentiel: true })),
    } as never
  );

  return service;
}

describe('ListPreuvesService', () => {
  it("refuse une preuve d'audit dont l'audit manque, au lieu de la rendre", async () => {
    const service = buildService([preuveAuditHorsContrat]);

    const result = await service.listPreuvesAudit({ auditId: 10 }, user);

    expect(result).toEqual({
      success: false,
      error: 'DOCUMENT_SCHEMA_MISMATCH',
    });
  });

  it('refuse une preuve de labellisation sans demande, au lieu de la rendre', async () => {
    const service = buildService([
      { ...preuveAuditHorsContrat, preuveType: 'labellisation' },
    ]);

    const result = await service.listPreuvesLabellisation(
      { demandeId: 20 },
      user
    );

    expect(result).toEqual({
      success: false,
      error: 'DOCUMENT_SCHEMA_MISMATCH',
    });
  });
});
