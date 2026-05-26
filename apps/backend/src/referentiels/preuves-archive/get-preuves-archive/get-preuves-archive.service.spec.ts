import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  AuditPreuvesArchiveStatusEnum,
  type AuditPreuvesArchive,
} from '../models/audit-preuves-archive.table';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import { GetPreuvesArchiveService } from './get-preuves-archive.service';

const owner: AuthenticatedUser = { id: 'owner-id' } as AuthenticatedUser;

function makeArchive(
  overrides: Partial<AuditPreuvesArchive> = {}
): AuditPreuvesArchive {
  return {
    id: 'archive-id',
    collectiviteId: 1,
    referentielId: 'cae',
    auditId: 10,
    requestedBy: owner.id,
    status: AuditPreuvesArchiveStatusEnum.PENDING,
    totalFiles: 0,
    processedFiles: 0,
    storagePath: null,
    errorMessage: null,
    createdAt: '2026-05-19T00:00:00.000Z',
    modifiedAt: '2026-05-19T00:00:00.000Z',
    expiresAt: '2999-12-31T00:00:00.000Z',
    ...overrides,
  };
}

function buildService({
  isAllowed = true,
  getByIdResult = success(makeArchive()),
  signedUrlResult = success({ signedUrl: 'https://signed.example/archive.zip' }),
}: {
  isAllowed?: boolean;
  getByIdResult?: Result<AuditPreuvesArchive, PreuvesArchiveError>;
  signedUrlResult?: Result<{ signedUrl: string }, PreuvesArchiveError>;
} = {}): GetPreuvesArchiveService {
  const permissions = {
    isAllowed: vi.fn().mockResolvedValue(isAllowed),
  } as unknown;

  const repository = {
    getByIdForUser: vi.fn().mockResolvedValue(getByIdResult),
  } as unknown;

  const documentStorage = {
    createDocumentSignedUrl: vi.fn().mockResolvedValue(signedUrlResult),
  } as unknown;

  return new GetPreuvesArchiveService(
    permissions as never,
    repository as never,
    documentStorage as never
  );
}

describe('GetPreuvesArchiveService', () => {
  it("renvoie NOT_FOUND quand getByIdForUser ne trouve pas la ligne (anti-énumération via filtre SQL `requestedBy`)", async () => {
    const service = buildService({
      getByIdResult: failure(
        PreuvesArchiveErrorEnum.ARCHIVE_NOT_FOUND,
        new Error('Archive archive-id non trouvée')
      ),
    });

    const result = await service.get({
      archiveId: 'archive-id',
      user: owner,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe(PreuvesArchiveErrorEnum.ARCHIVE_NOT_FOUND);
  });

  it("renvoie une downloadUrl fraîche quand le statut est completed", async () => {
    const service = buildService({
      getByIdResult: success(
        makeArchive({
          status: AuditPreuvesArchiveStatusEnum.COMPLETED,
          storagePath: 'archive-id.zip',
          totalFiles: 4,
          processedFiles: 4,
        })
      ),
    });

    const result = await service.get({
      archiveId: 'archive-id',
      user: owner,
    });

    expect(result).toEqual(
      success({
        archiveId: 'archive-id',
        status: AuditPreuvesArchiveStatusEnum.COMPLETED,
        totalFiles: 4,
        processedFiles: 4,
        downloadUrl: 'https://signed.example/archive.zip',
        errorMessage: null,
      })
    );
  });

  it("renvoie NOT_FOUND quand l'utilisateur a perdu referentiels.read sur la collectivité", async () => {
    const service = buildService({
      isAllowed: false,
      getByIdResult: success(
        makeArchive({
          status: AuditPreuvesArchiveStatusEnum.COMPLETED,
          storagePath: 'archive-id.zip',
          totalFiles: 4,
          processedFiles: 4,
        })
      ),
    });

    const result = await service.get({
      archiveId: 'archive-id',
      user: owner,
    });

    expect(result).toEqual(
      failure(
        PreuvesArchiveErrorEnum.ARCHIVE_NOT_FOUND,
        new Error('Archive archive-id non trouvée')
      )
    );
  });

  it("ne signe pas une archive completed dont l'expires_at est dépassé", async () => {
    const service = buildService({
      getByIdResult: success(
        makeArchive({
          status: AuditPreuvesArchiveStatusEnum.COMPLETED,
          storagePath: 'archive-id.zip',
          totalFiles: 4,
          processedFiles: 4,
          expiresAt: '2020-01-01T00:00:00.000Z',
        })
      ),
    });

    const result = await service.get({
      archiveId: 'archive-id',
      user: owner,
    });

    expect(result).toEqual(
      success({
        archiveId: 'archive-id',
        status: AuditPreuvesArchiveStatusEnum.COMPLETED,
        totalFiles: 4,
        processedFiles: 4,
        downloadUrl: null,
        errorMessage: null,
      })
    );
  });

  it("ne renvoie pas de downloadUrl tant que l'archive n'est pas completed", async () => {
    const service = buildService({
      getByIdResult: success(
        makeArchive({ status: AuditPreuvesArchiveStatusEnum.PROCESSING, totalFiles: 4, processedFiles: 1 })
      ),
    });

    const result = await service.get({
      archiveId: 'archive-id',
      user: owner,
    });

    expect(result).toEqual(
      success({
        archiveId: 'archive-id',
        status: AuditPreuvesArchiveStatusEnum.PROCESSING,
        totalFiles: 4,
        processedFiles: 1,
        downloadUrl: null,
        errorMessage: null,
      })
    );
  });
});
