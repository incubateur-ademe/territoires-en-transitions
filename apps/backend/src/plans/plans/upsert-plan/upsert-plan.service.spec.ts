import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import type { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { describe, expect, it, vi } from 'vitest';
import { upsertPlanErrorConfig } from './upsert-plan.errors';
import type { UpsertPlanRepository } from './upsert-plan.repository';
import { UpsertPlanService } from './upsert-plan.service';

const user = { id: 'user-1' } as AuthenticatedUser;
const tx = {} as Transaction;
const collectiviteId = 10;
const electrificationTypeId = 73;

const buildService = (existingTypeId: number | null = null) => {
  const repository = {
    findPlanType: vi.fn(async (id: number) => ({
      id,
      type: id === electrificationTypeId ? 'Plan Électrification' : 'PCAET',
    })),
    findPlanAxe: vi.fn(async () => ({
      id: 42,
      collectiviteId,
      typeId: existingTypeId,
      parent: null,
    })),
    create: vi.fn(async () => success({ id: 43 })),
    update: vi.fn(async () => success({ id: 42 })),
  };
  const service = new UpsertPlanService(
    {
      isAllowed: vi.fn(async () => success(undefined)),
    } as unknown as PermissionService,
    repository as unknown as UpsertPlanRepository,
    {
      db: {
        transaction: (run: (transaction: Transaction) => unknown) => run(tx),
      },
    } as unknown as DatabaseService
  );
  return { service, repository };
};

describe('UpsertPlanService — création des plans Électrification', () => {
  it.each([undefined, tx])(
    'refuse la création avant toute écriture, avec ou sans transaction fournie',
    async (transaction) => {
      const { service, repository } = buildService();
      const result = await service.upsertPlan(
        {
          collectiviteId,
          nom: 'Plan électrique',
          typeId: electrificationTypeId,
        },
        { user, tx: transaction }
      );
      expect(result).toEqual({
        success: false,
        error: 'ELECTRIFICATION_CREATION_DISABLED',
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
      expect(() =>
        createTrpcErrorHandler(upsertPlanErrorConfig)(result)
      ).toThrow(
        'La création d’un plan Électrification est temporairement indisponible.'
      );
    }
  );

  it('refuse de convertir un autre plan en plan Électrification', async () => {
    const { service, repository } = buildService(1);
    const result = await service.upsertPlan(
      { id: 42, collectiviteId, typeId: electrificationTypeId },
      { user }
    );
    expect(result).toEqual({
      success: false,
      error: 'ELECTRIFICATION_CREATION_DISABLED',
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([undefined, electrificationTypeId])(
    'permet de modifier un plan Électrification existant',
    async (typeId) => {
      const { service, repository } = buildService(electrificationTypeId);
      const result = await service.upsertPlan(
        { id: 42, collectiviteId, nom: 'Plan renommé', typeId },
        { user }
      );
      expect(result.success).toBe(true);
      expect(repository.update).toHaveBeenCalledOnce();
      expect(repository.create).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, 1])(
    'permet de créer un plan avec un autre type ou sans type',
    async (typeId) => {
      const { service, repository } = buildService();
      const result = await service.upsertPlan(
        { collectiviteId, nom: 'Plan climat', typeId },
        { user }
      );
      expect(result.success).toBe(true);
      expect(repository.create).toHaveBeenCalledOnce();
    }
  );

  it('permet de retirer le type Électrification d’un plan existant', async () => {
    const { service, repository } = buildService(electrificationTypeId);
    const result = await service.upsertPlan(
      { id: 42, collectiviteId, typeId: null },
      { user }
    );
    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledOnce();
  });
});
