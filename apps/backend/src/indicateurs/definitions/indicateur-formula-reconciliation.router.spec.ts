import { getServiceRoleUser } from '@tet/backend/test';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndicateurFormulaReconciliationRouter } from './indicateur-formula-reconciliation.router';
import {
  DEFAULT_FORMULA_RECONCILIATION_DRAIN_LIMIT,
  IndicateurFormulaReconciliationService,
} from './indicateur-formula-reconciliation.service';

describe('IndicateurFormulaReconciliationRouter', () => {
  const service = {
    drain: vi.fn<IndicateurFormulaReconciliationService['drain']>(),
  };
  const trpc = new TrpcService(
    { autoSetContextFromPayload: vi.fn() } as never,
    {} as never,
    {} as never,
    {} as never
  );
  const router = new IndicateurFormulaReconciliationRouter(
    trpc,
    service as unknown as IndicateurFormulaReconciliationService
  ).router;
  const caller = router.createCaller({ user: getServiceRoleUser() });

  beforeEach(() => vi.resetAllMocks());

  it.each([0, 1])(
    'conserve le payload public avec %s échec individuel',
    async (failedCount) => {
      const payload = {
        processedCount: 2,
        obsoleteCount: 0,
        failedCount,
        remainingCount: 3,
        complete: false,
        identifiants: ['target_21'],
      };
      service.drain.mockResolvedValue(success(payload));

      await expect(caller.drain({})).resolves.toEqual(payload);
      expect(service.drain).toHaveBeenCalledExactlyOnceWith({
        limit: DEFAULT_FORMULA_RECONCILIATION_DRAIN_LIMIT,
      });
    }
  );

  it("propage un échec d'infrastructure en erreur tRPC pour la reprise du worker", async () => {
    const cause = new Error('database unavailable');
    service.drain.mockResolvedValue(failure('DATABASE_ERROR', cause));

    await expect(caller.drain({ limit: 10 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      cause,
    });
  });

  it('convertit une limite refusée par le service en BAD_REQUEST', async () => {
    service.drain.mockResolvedValue(failure('INVALID_DRAIN_LIMIT'));

    await expect(caller.drain({})).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('refuse une limite invalide avant tout appel au service', async () => {
    await expect(caller.drain({ limit: 0 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    expect(service.drain).not.toHaveBeenCalled();
  });

  it.each([null, buildRequesterUser('user-id')])(
    'réserve le drain au service role (%j)',
    async (user) => {
      await expect(
        router.createCaller({ user }).drain({})
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
      expect(service.drain).not.toHaveBeenCalled();
    }
  );
});
