import { failure, success } from '@tet/backend/utils/result.type';
import { ActionTypeEnum, type ReferentielId } from '@tet/domain/referentiels';
import { describe, expect, it, vi } from 'vitest';
import {
  AuditPreuvesArchiveStatusEnum,
  type AuditPreuvesArchive,
} from '../models/audit-preuves-archive.table';
import { GeneratePreuvesArchiveService } from './generate-preuves-archive.service';

const archiveId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 1;
const auditId = 10;
const demandeId = 20;
const requesterId = 'user-id';
const referentielId: ReferentielId = 'cae';

const referentielTree = {
  itemsTree: {
    actionId: 'cae',
    actionType: ActionTypeEnum.REFERENTIEL,
    identifiant: '',
    nom: 'CAE',
    actionsEnfant: [],
  },
};

function makeArchive(
  overrides: Partial<AuditPreuvesArchive> = {}
): AuditPreuvesArchive {
  return {
    id: archiveId,
    collectiviteId,
    referentielId,
    auditId,
    requestedBy: requesterId,
    status: AuditPreuvesArchiveStatusEnum.PENDING,
    totalFiles: 0,
    processedFiles: 0,
    storagePath: null,
    errorMessage: null,
    createdAt: '2026-05-19T00:00:00.000Z',
    modifiedAt: '2026-05-19T00:00:00.000Z',
    expiresAt: '2026-05-26T00:00:00.000Z',
    ...overrides,
  };
}

function buildService({
  initialArchive = makeArchive(),
  canReadReferentiel = true,
  buildSucceeds = true,
  getByIdRawSucceeds = true,
}: {
  initialArchive?: AuditPreuvesArchive;
  canReadReferentiel?: boolean;
  buildSucceeds?: boolean;
  getByIdRawSucceeds?: boolean;
} = {}): {
  service: GeneratePreuvesArchiveService;
  repository: {
    getByIdRaw: ReturnType<typeof vi.fn>;
    transitionToProcessing: ReturnType<typeof vi.fn>;
    markCompleted: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
    updateProgress: ReturnType<typeof vi.fn>;
  };
} {
  const repository = {
    getByIdRaw: vi
      .fn()
      .mockResolvedValue(
        getByIdRawSucceeds
          ? success(initialArchive)
          : failure('ARCHIVE_NOT_FOUND', new Error('not found'))
      ),
    transitionToProcessing: vi
      .fn()
      .mockResolvedValue(success({ ...initialArchive, status: AuditPreuvesArchiveStatusEnum.PROCESSING })),
    markCompleted: vi
      .fn()
      .mockResolvedValue(success({ ...initialArchive, status: AuditPreuvesArchiveStatusEnum.COMPLETED })),
    markFailed: vi
      .fn()
      .mockResolvedValue(success({ ...initialArchive, status: AuditPreuvesArchiveStatusEnum.FAILED })),
    updateProgress: vi.fn().mockResolvedValue(success(initialArchive)),
  };

  const listAuditPreuves = {
    list: vi.fn().mockResolvedValue(
      success({
        mesure: { files: [], links: [] },
        demande: { files: [], links: [] },
        audit: { files: [], links: [] },
      })
    ),
  } as unknown;

  const getReferentielService = {
    getReferentielTree: vi.fn().mockResolvedValue(referentielTree),
  } as unknown;

  const buildAndUpload = vi
    .fn()
    .mockResolvedValue(
      buildSucceeds
        ? success({ totalFiles: 0 })
        : failure('CREATE_ARCHIVE_ERROR', new Error('upload KO'))
    );
  const buildArchiveService = { buildAndUpload } as unknown;

  const getLabellisationService = {
    getAudit: vi.fn().mockResolvedValue(success({ id: auditId, demandeId })),
  } as unknown;

  const isAllowed = vi.fn().mockResolvedValue(canReadReferentiel);
  const permissions = { isAllowed } as unknown;

  const service = new GeneratePreuvesArchiveService(
    repository as never,
    listAuditPreuves as never,
    getReferentielService as never,
    buildArchiveService as never,
    getLabellisationService as never,
    permissions as never
  );

  return { service, repository };
}

// Le happy-path (processing → completed, vrai ZIP) est prouvé de bout en bout
// par preuves-archive.full-pipeline.e2e-spec. Ce spec ne couvre que les cas
// d'erreur et le no-op, dont le mapping retryable est propre au service.
describe('GeneratePreuvesArchiveService.generate', () => {
  it("no-op si l'archive est déjà completed (ré-livraison stalled)", async () => {
    const { service, repository } = buildService({
      initialArchive: makeArchive({ status: AuditPreuvesArchiveStatusEnum.COMPLETED }),
    });

    const result = await service.generate(archiveId);

    expect(result).toEqual({ success: true, data: undefined });
    expect(repository.transitionToProcessing).not.toHaveBeenCalled();
    expect(repository.markCompleted).not.toHaveBeenCalled();
  });

  it('échec non-retryable si archive introuvable, sans écrire failed', async () => {
    const { service, repository } = buildService({ getByIdRawSucceeds: false });

    const result = await service.generate(archiveId);

    expect(result).toEqual({
      success: false,
      error: { message: expect.stringContaining('introuvable'), retryable: false },
    });
    expect(repository.markFailed).not.toHaveBeenCalled();
  });

  it("échec non-retryable si l'utilisateur a perdu referentiels.read, sans écrire failed", async () => {
    const { service, repository } = buildService({ canReadReferentiel: false });

    const result = await service.generate(archiveId);

    expect(result).toEqual({
      success: false,
      error: {
        message: expect.stringContaining("n'a plus le droit referentiels.read"),
        retryable: false,
      },
    });
    expect(repository.markFailed).not.toHaveBeenCalled();
    expect(repository.markCompleted).not.toHaveBeenCalled();
  });

  it('échec retryable si buildAndUpload échoue, sans écrire failed (BullMQ retentera)', async () => {
    const { service, repository } = buildService({ buildSucceeds: false });

    const result = await service.generate(archiveId);

    expect(result).toEqual({
      success: false,
      error: {
        message: expect.stringContaining("Construction de l'archive échouée"),
        retryable: true,
      },
    });
    expect(repository.markFailed).not.toHaveBeenCalled();
    expect(repository.markCompleted).not.toHaveBeenCalled();
  });
});

describe('GeneratePreuvesArchiveService.markFailed', () => {
  it('délègue au repository pour marquer la ligne failed', async () => {
    const { service, repository } = buildService();

    await service.markFailed(archiveId, 'boom');

    expect(repository.markFailed).toHaveBeenCalledWith(archiveId, 'boom');
  });
});
