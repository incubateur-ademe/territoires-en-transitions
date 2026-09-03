import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { describe, expect, it, vi } from 'vitest';
import type {
  CollectedFilePreuve,
  CollectedLinkPreuve,
  MissingFilePreuve,
} from './collect-preuves.repository';
import { CollectAuditPreuvesService } from './collect-audit-preuves.service';

const user = { id: 'user-id' } as AuthenticatedUser;

const referentielId: ReferentielId = 'cae';

const baseInput = {
  collectiviteId: 1,
  referentielId,
  auditId: 10,
  demandeId: 20,
  user,
};

const empty = { files: [], missingFiles: [], links: [] };

type PreuvesPayload = {
  files: CollectedFilePreuve[];
  missingFiles: MissingFilePreuve[];
  links: CollectedLinkPreuve[];
};

function buildService({
  complementaire = empty,
  reglementaire = empty,
  labellisation = empty,
  audit = empty,
  canReadConfidentiel = true,
}: {
  complementaire?: PreuvesPayload;
  reglementaire?: PreuvesPayload;
  labellisation?: PreuvesPayload;
  audit?: PreuvesPayload;
  canReadConfidentiel?: boolean;
} = {}): {
  service: CollectAuditPreuvesService;
  permissionsIsAllowed: ReturnType<typeof vi.fn>;
  getComplementairePreuves: ReturnType<typeof vi.fn>;
  getReglementairePreuves: ReturnType<typeof vi.fn>;
} {
  const repository = {
    getComplementairePreuves: vi
      .fn()
      .mockResolvedValue({ success: true, data: complementaire }),
    getReglementairePreuves: vi
      .fn()
      .mockResolvedValue({ success: true, data: reglementaire }),
    getLabellisationPreuves: vi
      .fn()
      .mockResolvedValue({ success: true, data: labellisation }),
    getAuditPreuves: vi
      .fn()
      .mockResolvedValue({ success: true, data: audit }),
  };

  const permissionsIsAllowed = vi.fn().mockResolvedValue(
    canReadConfidentiel
      ? { success: true, data: undefined }
      : { success: false, error: 'UNAUTHORIZED' }
  );
  const permissions = { isAllowed: permissionsIsAllowed } as unknown;

  const service = new CollectAuditPreuvesService(
    repository as never,
    permissions as never
  );

  return {
    service,
    permissionsIsAllowed,
    getComplementairePreuves: repository.getComplementairePreuves,
    getReglementairePreuves: repository.getReglementairePreuves,
  };
}

function makeFile(
  overrides: Partial<CollectedFilePreuve> = {}
): CollectedFilePreuve {
  return {
    bucketId: 'bucket-1',
    hash: 'hash-1',
    filename: 'doc.pdf',
    filesize: 1024,
    actionId: null,
    ...overrides,
  };
}

describe('CollectAuditPreuvesService', () => {
  it('interroge la permission `collectivites.documents.read_confidentiel` sur la collectivité', async () => {
    const { service, permissionsIsAllowed } = buildService();

    await service.collect(baseInput);

    expect(permissionsIsAllowed).toHaveBeenCalledWith(
      user,
      'collectivites.documents.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId: 1 }
    );
  });

  it('transmet le referentielId aux collectes mesure (complémentaire et réglementaire)', async () => {
    const { service, getComplementairePreuves, getReglementairePreuves } =
      buildService();

    await service.collect(baseInput);

    expect(getComplementairePreuves).toHaveBeenCalledWith(
      expect.objectContaining({ referentielId })
    );
    expect(getReglementairePreuves).toHaveBeenCalledWith(
      expect.objectContaining({ referentielId })
    );
  });

  it('fusionne complémentaires et réglementaires sous le bucket `mesure`', async () => {
    const { service } = buildService({
      complementaire: {
        files: [makeFile({ actionId: 'cae_1.1.1', filename: 'comp.pdf' })],
        missingFiles: [],
        links: [],
      },
      reglementaire: {
        files: [makeFile({ actionId: 'cae_1.1.1', filename: 'regl.pdf' })],
        missingFiles: [],
        links: [],
      },
    });

    const result = await service.collect(baseInput);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.mesure.files.map((file) => file.filename)).toEqual([
      'comp.pdf',
      'regl.pdf',
    ]);
  });

  it("propage l'échec d'une requête repository", async () => {
    const repository = {
      getComplementairePreuves: vi
        .fn()
        .mockResolvedValue({ success: false, error: 'COLLECT_PREUVES_ERROR' }),
      getReglementairePreuves: vi
        .fn()
        .mockResolvedValue({ success: true, data: empty }),
      getLabellisationPreuves: vi
        .fn()
        .mockResolvedValue({ success: true, data: empty }),
      getAuditPreuves: vi
        .fn()
        .mockResolvedValue({ success: true, data: empty }),
    } as unknown;
    const service = new CollectAuditPreuvesService(
      repository as never,
      {
        isAllowed: vi
          .fn()
          .mockResolvedValue({ success: true, data: undefined }),
      } as never
    );

    const result = await service.collect(baseInput);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe('COLLECT_PREUVES_ERROR');
  });
});
