import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { ReferentielId } from '@tet/domain/referentiels';
import { describe, expect, it, vi } from 'vitest';
import {
  AuditPreuvesArchiveStatusEnum,
  type AuditPreuvesArchive,
} from '../models/audit-preuves-archive.table';
import { PreuvesArchiveErrorEnum } from '../preuves-archive.errors';
import { RequestPreuvesArchiveService } from './request-preuves-archive.service';

const owner: AuthenticatedUser = { id: 'owner-id' } as AuthenticatedUser;

const requestInput = {
  collectiviteId: 1,
  referentielId: 'cae' as ReferentielId,
  user: owner,
};

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
    expiresAt: '2026-05-26T00:00:00.000Z',
    ...overrides,
  };
}

type CurrentAuditResult =
  | { success: true; data: { id: number } }
  | { success: false; error: 'NOT_FOUND' | 'DATABASE_ERROR' };

function buildService({
  isAllowed = true,
  currentAudit = success({ id: 10 }),
  isAuditeur = true,
}: {
  isAllowed?: boolean;
  currentAudit?: CurrentAuditResult;
  isAuditeur?: boolean;
} = {}): RequestPreuvesArchiveService {
  const permissions = {
    isAllowed: vi.fn().mockResolvedValue(isAllowed),
  } as unknown;

  const getLabellisationService = {
    getCurrentAudit: vi.fn().mockResolvedValue(currentAudit),
  } as unknown;

  const repository = {
    getAuditeurMembership: vi.fn().mockResolvedValue(success(isAuditeur)),
    createOrGetInFlight: vi.fn().mockResolvedValue(success(makeArchive())),
  } as unknown;

  const queue = {
    add: vi.fn().mockResolvedValue(undefined),
  } as unknown;

  return new RequestPreuvesArchiveService(
    permissions as never,
    getLabellisationService as never,
    repository as never,
    queue as never
  );
}

describe('RequestPreuvesArchiveService', () => {
  // unauthorized et le happy-path sont prouvés en réel par le router e2e ; ce
  // spec ne garde que le mapping d'erreur propre au service.
  it("échoue avec AUDIT_NOT_FOUND quand aucun audit n'est en cours", async () => {
    const service = buildService({
      currentAudit: { success: false, error: 'NOT_FOUND' },
    });

    const result = await service.request(requestInput);

    expect(result).toEqual(
      failure(
        PreuvesArchiveErrorEnum.AUDIT_NOT_FOUND,
        new Error(
          'Aucun audit en cours pour la collectivité 1 et le référentiel cae'
        )
      )
    );
  });

  it("échoue avec UNAUTHORIZED quand l'utilisateur n'est pas auditeur de l'audit en cours", async () => {
    const service = buildService({ isAuditeur: false });

    const result = await service.request(requestInput);

    expect(result).toEqual(
      failure(
        PreuvesArchiveErrorEnum.UNAUTHORIZED,
        new Error(
          "L'utilisateur owner-id n'est pas auditeur de l'audit 10 en cours pour la collectivité 1"
        )
      )
    );
  });
});
