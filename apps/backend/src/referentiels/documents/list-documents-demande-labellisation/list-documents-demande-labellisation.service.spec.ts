import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ListDocumentsDemandeLabellisationService } from './list-documents-demande-labellisation.service';

const user = { id: 'user-id' } as AuthenticatedUser;

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

const documentSansDemande = {
  id: 1,
  collectiviteId: 1,
  fichierId: null,
  url: null,
  titre: null,
  commentaire: null,
  modifiedAt: '2026-01-15T10:00:00Z',
  modifiedBy: null,
  lien: null,
  fichier: null,
  demande: null,
  modifiedByNom: null,
  preuveType: 'labellisation',
};

function buildService(documents: unknown[]) {
  const listDocumentsDemandeLabellisation = vi
    .fn()
    .mockResolvedValue(success(documents));
  const service = new ListDocumentsDemandeLabellisationService(
    { listDocumentsDemandeLabellisation } as never,
    { getDemande: vi.fn().mockResolvedValue(success(demande)) } as never,
    {
      checkUserCanReadDocuments: vi
        .fn()
        .mockResolvedValue(success({ canReadConfidentiel: true })),
    } as never
  );

  return { service, listDocumentsDemandeLabellisation };
}

describe('ListDocumentsDemandeLabellisationService', () => {
  it('transmet au repository la collectivité portée par la demande chargée', async () => {
    const { service, listDocumentsDemandeLabellisation } = buildService([]);

    await service.listDocumentsDemandeLabellisation({ demandeId: 20 }, user);

    expect(listDocumentsDemandeLabellisation).toHaveBeenCalledWith({
      collectiviteId: demande.collectiviteId,
      demandeId: 20,
      canReadConfidentiel: true,
    });
  });

  it('refuse un document de labellisation sans demande, au lieu de le rendre', async () => {
    const { service } = buildService([documentSansDemande]);

    const result = await service.listDocumentsDemandeLabellisation(
      { demandeId: 20 },
      user
    );

    expect(result).toEqual({
      success: false,
      error: 'DOCUMENT_SCHEMA_MISMATCH',
    });
  });
});
