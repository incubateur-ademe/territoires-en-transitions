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
import { DeletePreuvesArchiveService } from './delete-preuves-archive.service';

const input = { auditId: 10, requestedBy: 'owner-id' };

const EXPIRED = '2020-01-01T00:00:00.000Z';

function makeArchive(
  overrides: Partial<AuditPreuvesArchive> & { id: string }
): AuditPreuvesArchive {
  return {
    collectiviteId: 1,
    referentielId: 'cae',
    auditId: 10,
    requestedBy: 'owner-id',
    status: AuditPreuvesArchiveStatusEnum.COMPLETED,
    totalFiles: 0,
    processedFiles: 0,
    storagePath: `${overrides.id}.zip`,
    errorMessage: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    modifiedAt: '2026-06-01T00:00:00.000Z',
    expiresAt: '2999-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function buildService({
  expired = success([]),
  candidates = success([]),
  removeDocument = success(undefined),
  deleteByIds = success([]),
}: {
  expired?: Result<AuditPreuvesArchive[], PreuvesArchiveError>;
  candidates?: Result<AuditPreuvesArchive[], PreuvesArchiveError>;
  removeDocument?: Result<undefined, PreuvesArchiveError>;
  deleteByIds?: Result<AuditPreuvesArchive[], PreuvesArchiveError>;
} = {}) {
  const repository = {
    deleteExpired: vi.fn().mockResolvedValue(expired),
    listForDeletion: vi.fn().mockResolvedValue(candidates),
    deleteByIds: vi.fn().mockResolvedValue(deleteByIds),
  };

  const documentStorage = {
    removeDocument: vi.fn().mockResolvedValue(removeDocument),
  };

  const service = new DeletePreuvesArchiveService(
    repository as never,
    documentStorage as never
  );

  return { service, repository, documentStorage };
}

describe('DeletePreuvesArchiveService', () => {
  it("supprime globalement les archives expirées, même d'un autre user ou collectivité", async () => {
    const { service, repository, documentStorage } = buildService({
      expired: success([
        makeArchive({
          id: 'autre',
          requestedBy: 'autre-user',
          collectiviteId: 99,
        }),
      ]),
    });

    const result = await service.delete(input);

    expect(result).toEqual(success(1));
    expect(documentStorage.removeDocument).toHaveBeenCalledWith({
      bucketId: 'preuves-archives',
      key: 'autre.zip',
    });
    expect(repository.deleteByIds).not.toHaveBeenCalled();
  });

  it('supprime la ligne avant le blob pour la passe scopée', async () => {
    const { service, repository, documentStorage } = buildService({
      candidates: success([
        makeArchive({ id: 'expiree', expiresAt: EXPIRED }),
        makeArchive({ id: 'fraiche' }),
      ]),
      deleteByIds: success([makeArchive({ id: 'expiree', expiresAt: EXPIRED })]),
    });

    const result = await service.delete(input);

    expect(result).toEqual(success(1));
    expect(repository.deleteByIds).toHaveBeenCalledWith(['expiree']);
    expect(documentStorage.removeDocument).toHaveBeenCalledWith({
      bucketId: 'preuves-archives',
      key: 'expiree.zip',
    });
    expect(repository.deleteByIds.mock.invocationCallOrder[0]).toBeLessThan(
      documentStorage.removeDocument.mock.invocationCallOrder[0]
    );
  });

  it('additionne les expirées globales et les archives au-delà de la limite', async () => {
    const { service } = buildService({
      expired: success([makeArchive({ id: 'globale', requestedBy: 'x' })]),
      candidates: success([
        makeArchive({ id: 'scopee', expiresAt: EXPIRED }),
        makeArchive({ id: 'fraiche' }),
      ]),
      deleteByIds: success([makeArchive({ id: 'scopee', expiresAt: EXPIRED })]),
    });

    const result = await service.delete(input);

    expect(result).toEqual(success(2));
  });

  it("ne touche à rien quand aucune archive n'est à supprimer", async () => {
    const { service, repository, documentStorage } = buildService({
      candidates: success([makeArchive({ id: 'fraiche' })]),
    });

    const result = await service.delete(input);

    expect(result).toEqual(success(0));
    expect(documentStorage.removeDocument).not.toHaveBeenCalled();
    expect(repository.deleteByIds).not.toHaveBeenCalled();
  });

  it('supprime quand même la ligne si la suppression du blob échoue', async () => {
    const { service, repository } = buildService({
      candidates: success([makeArchive({ id: 'expiree', expiresAt: EXPIRED })]),
      deleteByIds: success([makeArchive({ id: 'expiree', expiresAt: EXPIRED })]),
      removeDocument: failure(PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR),
    });

    const result = await service.delete(input);

    expect(result).toEqual(success(1));
    expect(repository.deleteByIds).toHaveBeenCalledWith(['expiree']);
  });

  it("propage l'échec de deleteExpired sans rien lister", async () => {
    const { service, repository } = buildService({
      expired: failure(PreuvesArchiveErrorEnum.UPDATE_ARCHIVE_ERROR),
    });

    const result = await service.delete(input);

    expect(result).toEqual(
      failure(PreuvesArchiveErrorEnum.UPDATE_ARCHIVE_ERROR)
    );
    expect(repository.listForDeletion).not.toHaveBeenCalled();
  });

  it("propage l'échec de listForDeletion", async () => {
    const { service, documentStorage } = buildService({
      candidates: failure(PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR),
    });

    const result = await service.delete(input);

    expect(result).toEqual(failure(PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR));
    expect(documentStorage.removeDocument).not.toHaveBeenCalled();
  });

  it("propage l'échec de deleteByIds", async () => {
    const { service } = buildService({
      candidates: success([makeArchive({ id: 'expiree', expiresAt: EXPIRED })]),
      deleteByIds: failure(PreuvesArchiveErrorEnum.UPDATE_ARCHIVE_ERROR),
    });

    const result = await service.delete(input);

    expect(result).toEqual(
      failure(PreuvesArchiveErrorEnum.UPDATE_ARCHIVE_ERROR)
    );
  });
});
